"use server";

import { createHash } from "node:crypto";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
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
  const admin = createAdminClient();
  const { data: invitation } = await admin
    .from("corporate_invitations")
    .select("id, corporate_id, email, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (
    !invitation ||
    invitation.status !== "pending" ||
    new Date(invitation.expires_at).getTime() <= Date.now()
  )
    throw new Error("Invitation expired or revoked");
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase())
    throw new Error("Use the invited email account");

  const { error: employeeError } = await admin
    .from("corporate_employees")
    .upsert(
      {
        corporate_id: invitation.corporate_id,
        user_id: user.id,
        email: invitation.email,
        name: user.user_metadata?.name ?? invitation.email.split("@")[0],
      },
      { onConflict: "corporate_id,email" },
    );
  if (employeeError) throw new Error("Employee account could not be linked");
  const { error } = await admin
    .from("corporate_invitations")
    .update({
      status: "accepted",
      accepted_by: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id)
    .eq("status", "pending");
  if (error) throw new Error("Invitation acceptance could not be saved");
}
