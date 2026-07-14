"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { encryptSensitiveBytes } from "@/lib/security/encryption";
import { enforceActionRateLimit } from "@/lib/security/action-rate-limit";
import { validatePrivateDocument } from "@/lib/storage/file-validation";
import { createClient } from "@/lib/supabase/server";

const campaignCategories = [
  "education",
  "food",
  "health",
  "women",
  "animals",
  "disaster",
] as const;

const createCampaignSchema = z.object({
  ngoId: z.string().uuid(),
  title: z.string().trim().min(5).max(100),
  shortDescription: z.string().trim().min(10).max(200),
  description: z.string().trim().min(30).max(10_000),
  goalAmount: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/),
  deadline: z.string().date(),
  imageUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
  category: z.enum(campaignCategories),
});

const campaignUpdateSchema = z.object({
  campaignId: z.string().uuid(),
  text: z.string().trim().min(10).max(2_000),
});

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

export async function createCampaignAction(input: unknown) {
  const values = createCampaignSchema.parse(input);
  const deadline = new Date(`${values.deadline}T23:59:59.999Z`);

  if (deadline.getTime() <= Date.now()) {
    throw new Error("Campaign deadline must be in the future");
  }

  const targetPaise = rupeesToPaise(values.goalAmount);
  if (!Number.isSafeInteger(targetPaise) || targetPaise < 10_000) {
    throw new Error("The fundraising goal must be at least ₹100");
  }

  const { supabase, user } = await verifiedUser();
  await enforceActionRateLimit({
    action: "campaign.create",
    maximumHits: 5,
    windowSeconds: 3_600,
  });
  const { data: ngo } = await supabase
    .from("ngos")
    .select("id")
    .eq("id", values.ngoId)
    .eq("user_id", user.id)
    .eq("profile_status", "published")
    .maybeSingle();

  if (!ngo) {
    throw new Error("A published NGO profile you own is required");
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      ngo_id: ngo.id,
      creator_id: user.id,
      title: values.title,
      short_description: values.shortDescription,
      description: values.description,
      target_paise: targetPaise,
      deadline: deadline.toISOString(),
      image_url: values.imageUrl || null,
      category: values.category,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("The campaign draft could not be created");
  }

  revalidatePath("/campaigns");
  return { id: data.id };
}

export async function createCampaignUpdateAction(input: unknown) {
  const values = campaignUpdateSchema.parse(input);
  const { supabase, user } = await verifiedUser();
  await enforceActionRateLimit({
    action: "campaign.update.publish",
    maximumHits: 20,
    windowSeconds: 3_600,
  });
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, creator_id")
    .eq("id", values.campaignId)
    .maybeSingle();

  if (!campaign || campaign.creator_id !== user.id) {
    throw new Error("Only the campaign owner may publish updates");
  }

  const { error } = await supabase.from("campaign_updates").insert({
    campaign_id: campaign.id,
    text: values.text,
  });

  if (error) {
    throw new Error("The campaign update could not be published");
  }

  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath(`/campaigns/${campaign.id}/updates`);
}

export async function createCampaignUpdateFormAction(formData: FormData) {
  return createCampaignUpdateAction({
    campaignId: formData.get("campaignId"),
    text: formData.get("text"),
  });
}

const supporterCampaignSchema = createCampaignSchema
  .omit({ ngoId: true })
  .extend({
    beneficiaryName: z.string().trim().min(2).max(120),
    beneficiaryRelationship: z.string().trim().min(3).max(200),
    payoutEmail: z.string().trim().toLowerCase().email().max(254),
    beneficiaryConsent: z.literal("true"),
  });

export async function createSupporterCampaignAction(formData: FormData) {
  const evidence = formData.get("evidence");
  if (!(evidence instanceof File)) {
    throw new Error("Beneficiary consent or identity evidence is required");
  }
  await validatePrivateDocument(evidence);

  const values = supporterCampaignSchema.parse({
    title: formData.get("title"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    goalAmount: formData.get("goalAmount"),
    deadline: formData.get("deadline"),
    imageUrl: formData.get("imageUrl") || "",
    category: formData.get("category"),
    beneficiaryName: formData.get("beneficiaryName"),
    beneficiaryRelationship: formData.get("beneficiaryRelationship"),
    payoutEmail: formData.get("payoutEmail"),
    beneficiaryConsent: formData.get("beneficiaryConsent"),
  });
  const deadline = new Date(`${values.deadline}T23:59:59.999Z`);
  if (deadline.getTime() <= Date.now()) {
    throw new Error("Campaign deadline must be in the future");
  }
  const targetPaise = rupeesToPaise(values.goalAmount);
  if (!Number.isSafeInteger(targetPaise) || targetPaise < 10_000) {
    throw new Error("The fundraising goal must be at least ₹100");
  }

  const { supabase, user } = await verifiedUser();
  await enforceActionRateLimit({
    action: "campaign.supporter.create",
    maximumHits: 3,
    windowSeconds: 86_400,
  });
  const { data: campaignId, error } = await supabase.rpc(
    "create_supporter_campaign",
    {
      campaign_title: values.title,
      campaign_short_description: values.shortDescription,
      campaign_description: values.description,
      campaign_target_paise: targetPaise,
      campaign_deadline: deadline.toISOString(),
      campaign_category: values.category,
      campaign_image_url: values.imageUrl || "",
      beneficiary_name: values.beneficiaryName,
      beneficiary_relationship: values.beneficiaryRelationship,
      payout_email: values.payoutEmail,
    },
  );
  if (error || typeof campaignId !== "string") {
    throw new Error("The supporter fundraiser draft could not be created");
  }

  const evidenceId = crypto.randomUUID();
  const storagePath = `${campaignId}/${evidenceId}.encrypted`;
  const encrypted = encryptSensitiveBytes(
    new Uint8Array(await evidence.arrayBuffer()),
    `campaign-evidence:${campaignId}:${evidenceId}`,
  );
  const { error: uploadError } = await supabase.storage
    .from("campaign-evidence")
    .upload(storagePath, encrypted, {
      contentType: "application/octet-stream",
      upsert: false,
    });
  if (uploadError) {
    throw new Error("The fundraiser was saved, but evidence upload failed");
  }

  const evidenceMetadata = [
    {
      id: evidenceId,
      storagePath,
      originalName: evidence.name.slice(0, 255),
      mimeType: evidence.type,
      sizeBytes: evidence.size,
      encryptionVersion: 1,
    },
  ];
  const { error: updateError } = await supabase
    .from("campaigns")
    .update({ evidence: evidenceMetadata })
    .eq("id", campaignId)
    .eq("creator_id", user.id);
  if (updateError) {
    await supabase.storage.from("campaign-evidence").remove([storagePath]);
    throw new Error("The fundraiser evidence could not be linked");
  }

  revalidatePath("/campaigns");
  return { id: campaignId };
}
