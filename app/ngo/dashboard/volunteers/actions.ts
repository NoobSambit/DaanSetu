"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireOwnedNgo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data: ngo } = await supabase
    .from("ngos")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ngo) throw new Error("NGO access required");
  return { user, ngo };
}

export async function reviewVolunteerApplicationAction(input: unknown) {
  const values = z
    .object({
      applicationId: z.string().uuid(),
      status: z.enum(["shortlisted", "accepted", "rejected"]),
    })
    .parse(input);
  const { ngo } = await requireOwnedNgo();
  const admin = createAdminClient();
  const { data: application } = await admin
    .from("volunteer_applications")
    .select("id, opportunity_id, volunteer_opportunities(ngo_id)")
    .eq("id", values.applicationId)
    .maybeSingle();
  const opportunity = application?.volunteer_opportunities as {
    ngo_id?: string;
  } | null;
  if (!application || opportunity?.ngo_id !== ngo.id)
    throw new Error("Application not found");
  const { error } = await admin
    .from("volunteer_applications")
    .update({ status: values.status })
    .eq("id", application.id);
  if (error) throw new Error("Application decision could not be saved");
  revalidatePath("/ngo/dashboard/volunteers");
}

export async function reviewVolunteerHoursAction(input: unknown) {
  const values = z
    .object({
      hoursId: z.string().uuid(),
      status: z.enum(["approved", "rejected"]),
      note: z.string().trim().max(500).optional(),
    })
    .parse(input);
  const { user, ngo } = await requireOwnedNgo();
  const admin = createAdminClient();
  const { data: hours } = await admin
    .from("volunteer_hours")
    .select("id, user_id, opportunity_id, ngo_id, hours")
    .eq("id", values.hoursId)
    .maybeSingle();
  if (!hours || hours.ngo_id !== ngo.id)
    throw new Error("Hours record not found");
  const { error } = await admin
    .from("volunteer_hours")
    .update({
      status: values.status,
      review_note: values.note ?? null,
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
      verified: values.status === "approved",
      verified_by: user.id,
      verified_at:
        values.status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", hours.id);
  if (error) throw new Error("Hours decision could not be saved");

  if (values.status === "approved") {
    await admin.from("volunteer_certificates").upsert(
      {
        user_id: hours.user_id,
        opportunity_id: hours.opportunity_id,
        ngo_id: ngo.id,
        certificate_number: `DSV-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
        hours_completed: hours.hours,
        verified_by: user.id,
      },
      { onConflict: "user_id,opportunity_id", ignoreDuplicates: true },
    );
  }
  revalidatePath("/ngo/dashboard/volunteers");
}
