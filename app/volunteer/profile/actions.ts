"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const volunteerSkills = [
  "Teaching",
  "Medical",
  "Event Support",
  "Fundraising",
  "Logistics",
  "Technical",
  "Other",
] as const;

const volunteerAvailability = ["Weekdays", "Weekends", "Flexible"] as const;

const volunteerProfileSchema = z.object({
  bio: z.string().trim().max(2_000).optional(),
  city: z.string().trim().min(2).max(100),
  skills: z.array(z.enum(volunteerSkills)).min(1).max(volunteerSkills.length),
  availability: z
    .array(z.enum(volunteerAvailability))
    .min(1)
    .max(volunteerAvailability.length),
});

export async function saveVolunteerProfileAction(input: unknown) {
  const values = volunteerProfileSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    throw new Error("A verified account is required");
  }

  const { data, error } = await supabase
    .from("volunteer_profiles")
    .upsert(
      {
        user_id: user.id,
        bio: values.bio || null,
        city: values.city,
        skills: [...new Set(values.skills)],
        availability: [...new Set(values.availability)],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("The volunteer profile could not be saved");
  }

  revalidatePath("/volunteer/profile");
  revalidatePath("/volunteer/opportunities");
  return { id: data.id };
}
