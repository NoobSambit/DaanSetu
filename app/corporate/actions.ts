"use server";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function corporateOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at)
    throw new Error("Verified corporate authentication required");
  const { data: corporate } = await supabase
    .from("corporate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!corporate) throw new Error("Corporate profile required");
  return { user, corporate };
}

export async function inviteCorporateEmployeeAction(input: unknown) {
  const values = z
    .object({ email: z.string().trim().toLowerCase().email() })
    .parse(input);
  const { user, corporate } = await corporateOwner();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await createAdminClient()
    .from("corporate_invitations")
    .insert({
      corporate_id: corporate.id,
      email: values.email,
      token_hash: tokenHash,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString(),
    });
  if (error) throw new Error("Invitation could not be created");
  return {
    invitationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/corporate/invitations/${token}`,
  };
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
}
