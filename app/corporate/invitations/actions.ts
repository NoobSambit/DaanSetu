"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export async function acceptCorporateInvitationAction(rawToken: string) {
  const token = z.string().min(20).max(200).parse(rawToken);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at)
    throw new Error("A verified account is required");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await supabase.rpc("accept_corporate_invitation", {
    invitation_token_hash: tokenHash,
  });
  if (error) throw new Error("Invitation expired, revoked, or unavailable");
}

export async function acceptCorporateInvitationFormAction(formData: FormData) {
  await acceptCorporateInvitationAction(String(formData.get("token") ?? ""));
  redirect("/dashboard?corporateInvitation=accepted");
}
