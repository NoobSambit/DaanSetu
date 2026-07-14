"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { campaignStatuses } from "@/lib/domain/campaigns";
import { encryptSensitiveBytes } from "@/lib/security/encryption";
import { validatePrivateDocument } from "@/lib/storage/file-validation";
import { createClient } from "@/lib/supabase/server";

const editableCampaignSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().trim().min(5).max(100),
  shortDescription: z.string().trim().min(10).max(200),
  description: z.string().trim().min(30).max(10_000),
  goalAmount: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/),
  deadline: z.string().date(),
  imageUrl: z.union([z.string().trim().url(), z.literal("")]),
  category: z.enum([
    "education",
    "food",
    "health",
    "women",
    "animals",
    "disaster",
  ]),
  beneficiaryName: z.string().trim().min(2).max(120).optional(),
  beneficiaryRelationship: z.string().trim().min(3).max(200).optional(),
  payoutEmail: z.string().trim().toLowerCase().email().max(254).optional(),
});

const milestoneSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1_000).optional(),
  targetAmount: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/),
});

const deleteMilestoneSchema = z.object({
  campaignId: z.string().uuid(),
  milestoneId: z.string().uuid(),
});

const transitionSchema = z.object({
  campaignId: z.string().uuid(),
  status: z.enum(campaignStatuses),
  note: z.string().trim().max(1000).optional(),
});

type EvidenceMetadata = {
  id: string;
  storagePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  encryptionVersion: number;
};

function rupeesToPaise(value: string) {
  const [rupees, paise = ""] = value.split(".");
  return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
}

async function verifiedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    throw new Error("A verified account is required");
  }

  return { supabase, user };
}

async function ownedEditableCampaign(campaignId: string) {
  const { supabase, user } = await verifiedUser();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, creator_id, ngo_id, status, target_paise, evidence, beneficiary, payout_account_id",
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign || campaign.creator_id !== user.id) {
    throw new Error("Only the campaign owner may edit this fundraiser");
  }
  if (!["draft", "changes_requested"].includes(campaign.status)) {
    throw new Error("Only draft campaigns may be edited");
  }

  return { supabase, user, campaign };
}

export async function updateCampaignDraftFormAction(formData: FormData) {
  const evidence = formData.get("evidence");
  const values = editableCampaignSchema.parse({
    campaignId: formData.get("campaignId"),
    title: formData.get("title"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    goalAmount: formData.get("goalAmount"),
    deadline: formData.get("deadline"),
    imageUrl: formData.get("imageUrl") || "",
    category: formData.get("category"),
    beneficiaryName: formData.get("beneficiaryName") || undefined,
    beneficiaryRelationship:
      formData.get("beneficiaryRelationship") || undefined,
    payoutEmail: formData.get("payoutEmail") || undefined,
  });
  const deadline = new Date(`${values.deadline}T23:59:59.999Z`);
  const targetPaise = rupeesToPaise(values.goalAmount);

  if (deadline.getTime() <= Date.now()) {
    throw new Error("Campaign deadline must be in the future");
  }
  if (!Number.isSafeInteger(targetPaise) || targetPaise < 10_000) {
    throw new Error("The fundraising goal must be at least ₹100");
  }

  const { supabase, user, campaign } = await ownedEditableCampaign(
    values.campaignId,
  );
  const isSupporterCampaign = campaign.ngo_id === null;
  if (
    isSupporterCampaign &&
    (!values.beneficiaryName ||
      !values.beneficiaryRelationship ||
      !values.payoutEmail)
  ) {
    throw new Error("Beneficiary and payout details are required");
  }

  let uploadedPath: string | null = null;
  let evidenceMetadata = Array.isArray(campaign.evidence)
    ? (campaign.evidence as EvidenceMetadata[])
    : [];
  if (evidence instanceof File && evidence.size > 0) {
    await validatePrivateDocument(evidence);
    const evidenceId = crypto.randomUUID();
    uploadedPath = `${campaign.id}/${evidenceId}.encrypted`;
    const encrypted = encryptSensitiveBytes(
      new Uint8Array(await evidence.arrayBuffer()),
      `campaign-evidence:${campaign.id}:${evidenceId}`,
    );
    const { error: uploadError } = await supabase.storage
      .from("campaign-evidence")
      .upload(uploadedPath, encrypted, {
        contentType: "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      throw new Error("The fundraiser evidence could not be uploaded");
    }
    evidenceMetadata = [
      ...evidenceMetadata,
      {
        id: evidenceId,
        storagePath: uploadedPath,
        originalName: evidence.name.slice(0, 255),
        mimeType: evidence.type,
        sizeBytes: evidence.size,
        encryptionVersion: 1,
      },
    ];
  }

  const { error: updateError } = await supabase
    .from("campaigns")
    .update({
      title: values.title,
      short_description: values.shortDescription,
      description: values.description,
      target_paise: targetPaise,
      deadline: deadline.toISOString(),
      image_url: values.imageUrl || null,
      category: values.category,
      evidence: evidenceMetadata,
      beneficiary: isSupporterCampaign
        ? {
            name: values.beneficiaryName,
            relationship: values.beneficiaryRelationship,
          }
        : campaign.beneficiary,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaign.id)
    .eq("creator_id", user.id)
    .in("status", ["draft", "changes_requested"]);

  if (updateError) {
    if (uploadedPath) {
      await supabase.storage.from("campaign-evidence").remove([uploadedPath]);
    }
    throw new Error("The campaign draft could not be updated");
  }

  if (isSupporterCampaign && campaign.payout_account_id) {
    const { error: payoutError } = await supabase
      .from("payout_accounts")
      .update({
        beneficiary: {
          beneficiaryName: values.beneficiaryName,
          recipientEmail: values.payoutEmail,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.payout_account_id)
      .eq("owner_id", user.id)
      .in("status", ["pending", "restricted"]);

    if (payoutError) {
      throw new Error(
        "Campaign saved, but payout details could not be updated",
      );
    }
  }

  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath(`/campaigns/${campaign.id}/manage`);
}

export async function createCampaignMilestoneFormAction(formData: FormData) {
  const values = milestoneSchema.parse({
    campaignId: formData.get("campaignId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    targetAmount: formData.get("targetAmount"),
  });
  const targetPaise = rupeesToPaise(values.targetAmount);
  const { supabase, campaign } = await ownedEditableCampaign(values.campaignId);

  if (
    !Number.isSafeInteger(targetPaise) ||
    targetPaise <= 0 ||
    targetPaise > campaign.target_paise
  ) {
    throw new Error("Milestone amount must be within the campaign goal");
  }

  const { count, error: countError } = await supabase
    .from("campaign_milestones")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id);
  if (countError) {
    throw new Error("Campaign milestones could not be read");
  }

  const { error } = await supabase.from("campaign_milestones").insert({
    campaign_id: campaign.id,
    title: values.title,
    description: values.description || null,
    target_paise: targetPaise,
    milestone_order: (count ?? 0) + 1,
  });
  if (error) {
    throw new Error("The campaign milestone could not be created");
  }

  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath(`/campaigns/${campaign.id}/manage`);
}

export async function deleteCampaignMilestoneFormAction(formData: FormData) {
  const values = deleteMilestoneSchema.parse({
    campaignId: formData.get("campaignId"),
    milestoneId: formData.get("milestoneId"),
  });
  const { supabase, campaign } = await ownedEditableCampaign(values.campaignId);
  const { error } = await supabase
    .from("campaign_milestones")
    .delete()
    .eq("id", values.milestoneId)
    .eq("campaign_id", campaign.id);

  if (error) {
    throw new Error("The campaign milestone could not be deleted");
  }

  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath(`/campaigns/${campaign.id}/manage`);
}

export async function transitionCampaignAction(input: unknown) {
  const values = transitionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    throw new Error("A verified account is required");
  }

  const { error } = await supabase.rpc("transition_campaign", {
    campaign_uuid: values.campaignId,
    next_status: values.status,
    decision_note: values.note ?? null,
  });

  if (error) {
    throw new Error("The campaign status could not be changed");
  }

  revalidatePath(`/campaigns/${values.campaignId}`);
  revalidatePath(`/campaigns/${values.campaignId}/manage`);
}

export async function transitionCampaignFormAction(formData: FormData) {
  return transitionCampaignAction({
    campaignId: formData.get("campaignId"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
}
