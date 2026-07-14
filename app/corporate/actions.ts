"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { enforceActionRateLimit } from "@/lib/security/action-rate-limit";
import { createClient } from "@/lib/supabase/server";

const companySizes = [
  "1-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

const corporateCampaignCauses = [
  "education",
  "food",
  "health",
  "disaster",
  "women",
  "animals",
  "environment",
] as const;

async function verifiedCorporateUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    throw new Error("Verified corporate authentication required");
  }

  const { data: account } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (account?.role !== "corporate") {
    throw new Error("A corporate account is required");
  }

  return { supabase, user };
}

async function corporateOwner() {
  const { supabase, user } = await verifiedCorporateUser();
  const { data: corporate } = await supabase
    .from("corporate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!corporate) throw new Error("Corporate profile required");
  return { user, corporate };
}

export async function saveCorporateProfileAction(input: unknown) {
  const values = z
    .object({
      companyName: z.string().trim().min(2).max(150),
      industry: z.string().trim().min(2).max(100),
      companySize: z.enum(companySizes),
      description: z.string().trim().max(3_000).optional(),
      website: z.union([z.string().trim().url(), z.literal("")]).optional(),
      logoUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
    })
    .parse(input);
  const { supabase, user } = await verifiedCorporateUser();
  const { data, error } = await supabase
    .from("corporate_profiles")
    .upsert(
      {
        user_id: user.id,
        company_name: values.companyName,
        industry: values.industry,
        company_size: values.companySize,
        description: values.description || null,
        website: values.website || null,
        logo_url: values.logoUrl || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("The corporate profile could not be saved");
  }

  revalidatePath("/corporate/profile");
  revalidatePath("/corporate/dashboard");
  return { id: data.id };
}

export async function inviteCorporateEmployeeAction(input: unknown) {
  const values = z
    .object({ email: z.string().trim().toLowerCase().email() })
    .parse(input);
  await corporateOwner();
  await enforceActionRateLimit({
    action: "corporate.invitation.create",
    maximumHits: 20,
    windowSeconds: 3_600,
  });
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("Application URL is not configured");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitationUrl = `${appUrl.replace(/\/$/, "")}/corporate/invitations/${token}`;
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_corporate_invitation", {
    invited_email: values.email,
    invitation_token_hash: tokenHash,
    invitation_url: invitationUrl,
    invitation_expires_at: new Date(
      Date.now() + 7 * 24 * 60 * 60_000,
    ).toISOString(),
  });
  if (error) throw new Error("Invitation could not be created");
  revalidatePath("/corporate/employees");
  const mayRevealLink =
    process.env.NODE_ENV !== "production" ||
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(appUrl);
  return {
    invitationUrl: mayRevealLink ? invitationUrl : "",
  };
}

export async function revokeCorporateInvitationAction(invitationId: string) {
  const id = z.string().uuid().parse(invitationId);
  const { corporate } = await corporateOwner();
  const { error } = await createClient().then((client) =>
    client
      .from("corporate_invitations")
      .update({ status: "revoked" })
      .eq("id", id)
      .eq("corporate_id", corporate.id)
      .eq("status", "pending"),
  );

  if (error) {
    throw new Error("The invitation could not be revoked");
  }

  revalidatePath("/corporate/employees");
}

export async function createCorporateCampaignAction(input: unknown) {
  const values = z
    .object({
      title: z.string().trim().min(5).max(100),
      description: z.string().trim().min(20).max(5_000),
      cause: z.enum(corporateCampaignCauses),
      goalAmount: z
        .string()
        .trim()
        .regex(/^\d+(?:\.\d{1,2})?$/),
      deadline: z.string().date(),
      imageUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
    })
    .parse(input);
  const deadline = new Date(`${values.deadline}T23:59:59.999Z`);
  if (deadline.getTime() <= Date.now()) {
    throw new Error("Campaign deadline must be in the future");
  }

  const goalPaise = optionalRupeesToPaise(values.goalAmount);
  if (!goalPaise) {
    throw new Error("Enter a valid campaign goal");
  }

  const { corporate } = await corporateOwner();
  const { data, error } = await createClient().then((client) =>
    client
      .from("corporate_campaigns")
      .insert({
        corporate_id: corporate.id,
        title: values.title,
        description: values.description,
        cause: values.cause,
        goal_paise: goalPaise,
        deadline: deadline.toISOString(),
        image_url: values.imageUrl || null,
      })
      .select("id")
      .single(),
  );

  if (error || !data) {
    throw new Error("The CSR campaign could not be created");
  }

  revalidatePath("/corporate/campaigns");
  return { id: data.id };
}

export async function createCsrInitiativeAction(input: unknown) {
  const values = z
    .object({
      title: z.string().trim().min(5).max(150),
      description: z.string().trim().min(20).max(3000),
      matchPercent: z.number().int().min(0).max(500),
      perEmployeeCapPaise: z.number().int().positive().nullable(),
      initiativeCapPaise: z.number().int().positive().nullable(),
      startsAt: z.string().datetime(),
      endsAt: z.string().datetime(),
    })
    .refine((value) => value.endsAt > value.startsAt, {
      message: "End must follow start",
    })
    .parse(input);
  const { corporate } = await corporateOwner();
  const { error } = await createClient().then((client) =>
    client.from("csr_initiatives").insert({
      corporate_id: corporate.id,
      title: values.title,
      description: values.description,
      match_percent: values.matchPercent,
      per_employee_cap_paise: values.perEmployeeCapPaise,
      initiative_cap_paise: values.initiativeCapPaise,
      starts_at: values.startsAt,
      ends_at: values.endsAt,
    }),
  );
  if (error) throw new Error("CSR initiative could not be created");
  revalidatePath("/corporate/settlements");
  revalidatePath("/corporate/dashboard");
}

function optionalRupeesToPaise(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error("Enter a valid rupee amount");
  }
  const [rupees, paise = ""] = text.split(".");
  const result = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new Error("Enter a positive amount");
  }
  return result;
}

export async function createCsrInitiativeFormAction(formData: FormData) {
  const startsOn = z.string().date().parse(formData.get("startsOn"));
  const endsOn = z.string().date().parse(formData.get("endsOn"));
  await createCsrInitiativeAction({
    title: formData.get("title"),
    description: formData.get("description"),
    matchPercent: Number(formData.get("matchPercent")),
    perEmployeeCapPaise: optionalRupeesToPaise(formData.get("perEmployeeCap")),
    initiativeCapPaise: optionalRupeesToPaise(formData.get("initiativeCap")),
    startsAt: new Date(`${startsOn}T00:00:00.000Z`).toISOString(),
    endsAt: new Date(`${endsOn}T23:59:59.999Z`).toISOString(),
  });
}

export async function transitionCsrInitiativeFormAction(formData: FormData) {
  const values = z
    .object({
      initiativeId: z.string().uuid(),
      status: z.enum(["active", "paused", "completed", "cancelled"]),
    })
    .parse({
      initiativeId: formData.get("initiativeId"),
      status: formData.get("status"),
    });
  const { corporate } = await corporateOwner();
  const client = await createClient();
  const { data: initiative } = await client
    .from("csr_initiatives")
    .select("id, status")
    .eq("id", values.initiativeId)
    .eq("corporate_id", corporate.id)
    .maybeSingle();
  const allowed: Record<string, string[]> = {
    draft: ["active", "cancelled"],
    active: ["paused", "completed", "cancelled"],
    paused: ["active", "completed", "cancelled"],
  };
  if (!initiative || !allowed[initiative.status]?.includes(values.status)) {
    throw new Error("Invalid CSR initiative transition");
  }
  const { error } = await client
    .from("csr_initiatives")
    .update({ status: values.status, updated_at: new Date().toISOString() })
    .eq("id", initiative.id)
    .eq("corporate_id", corporate.id);
  if (error) throw new Error("CSR initiative status could not be updated");
  revalidatePath("/corporate/settlements");
}

export async function createPartnershipRequestAction(input: unknown) {
  const values = z
    .object({
      campaignId: z.string().uuid(),
      message: z.string().trim().max(1_000).optional(),
    })
    .parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    throw new Error("A verified NGO account is required");
  }
  const { data: ngo } = await supabase
    .from("ngos")
    .select("id")
    .eq("user_id", user.id)
    .eq("profile_status", "published")
    .eq("is_verified", true)
    .maybeSingle();
  if (!ngo) throw new Error("A verified, published NGO profile is required");
  await enforceActionRateLimit({
    action: "csr.partnership.request",
    maximumHits: 20,
    windowSeconds: 3_600,
  });
  const { data: campaign } = await supabase
    .from("corporate_campaigns")
    .select("id")
    .eq("id", values.campaignId)
    .eq("status", "active")
    .maybeSingle();
  if (!campaign) throw new Error("This CSR campaign is not accepting partners");

  const { error } = await supabase.from("partnership_requests").insert({
    corporate_campaign_id: campaign.id,
    ngo_id: ngo.id,
    message: values.message || null,
    status: "pending",
  });
  if (error) throw new Error("The partnership request could not be submitted");
  revalidatePath("/csr-campaigns");
  revalidatePath(`/corporate/campaigns/${campaign.id}`);
}

export async function reviewPartnershipRequestAction(input: unknown) {
  const values = z
    .object({
      requestId: z.string().uuid(),
      status: z.enum(["accepted", "rejected"]),
    })
    .parse(input);
  await corporateOwner();
  const supabase = await createClient();
  const { data: request, error } = await supabase.rpc(
    "review_partnership_request",
    {
      partnership_request_uuid: values.requestId,
      next_status: values.status,
    },
  );
  if (error) throw new Error("The partnership decision could not be saved");
  revalidatePath(`/corporate/campaigns/${request.corporate_campaign_id}`);
}
