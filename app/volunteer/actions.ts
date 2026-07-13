"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const applicationSchema = z.object({
  opportunityId: z.string().uuid(),
  message: z.string().trim().min(20).max(1500),
});

export async function submitVolunteerApplicationAction(input: unknown) {
  const values = applicationSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at)
    throw new Error("A verified account is required");
  const { data: profile } = await supabase
    .from("volunteer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) throw new Error("Complete your volunteer profile first");
  const { error } = await supabase.from("volunteer_applications").insert({
    opportunity_id: values.opportunityId,
    user_id: user.id,
    message: values.message,
    status: "submitted",
  });
  if (error?.code === "23505")
    throw new Error("You already applied for this opportunity");
  if (error) throw new Error("Application could not be submitted");
  revalidatePath("/volunteer/opportunities");
}

export async function withdrawVolunteerApplicationAction(
  applicationId: string,
) {
  const id = z.string().uuid().parse(applicationId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { error } = await supabase
    .from("volunteer_applications")
    .update({ status: "withdrawn" })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", ["submitted", "shortlisted"]);
  if (error) throw new Error("Application could not be withdrawn");
}

export async function submitVolunteerHoursAction(input: unknown) {
  const values = z
    .object({
      opportunityId: z.string().uuid(),
      ngoId: z.string().uuid(),
      hours: z.number().positive().max(24),
      date: z.string().date(),
      description: z.string().trim().min(10).max(1000),
    })
    .parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data: accepted } = await supabase
    .from("volunteer_applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("opportunity_id", values.opportunityId)
    .eq("status", "accepted")
    .maybeSingle();
  if (!accepted) throw new Error("Only accepted volunteers may submit hours");
  const { error } = await supabase.from("volunteer_hours").insert({
    user_id: user.id,
    opportunity_id: values.opportunityId,
    ngo_id: values.ngoId,
    hours: values.hours,
    date: values.date,
    description: values.description,
    status: "pending",
  });
  if (error) throw new Error("Volunteer hours could not be submitted");
}
