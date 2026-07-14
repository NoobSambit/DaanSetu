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

const availabilityOptions = ["Weekdays", "Weekends", "Flexible"] as const;

async function requireOwnedNgo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    throw new Error("A verified account is required");
  }

  const { data: ngo } = await supabase
    .from("ngos")
    .select("id, profile_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ngo || ngo.profile_status !== "published") {
    throw new Error("A published NGO profile is required");
  }

  return { supabase, user, ngo };
}

const opportunitySchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().min(30).max(5_000),
  city: z.string().trim().min(2).max(100),
  requiredSkills: z.array(z.enum(volunteerSkills)).min(1),
  availability: z.array(z.enum(availabilityOptions)).min(1),
  date: z.string().date(),
  totalNeeded: z.coerce.number().int().min(1).max(10_000),
});

export async function createVolunteerOpportunityFormAction(formData: FormData) {
  const values = opportunitySchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    city: formData.get("city"),
    requiredSkills: formData.getAll("requiredSkills"),
    availability: formData.getAll("availability"),
    date: formData.get("date"),
    totalNeeded: formData.get("totalNeeded"),
  });

  const opportunityDate = new Date(`${values.date}T23:59:59.999Z`);
  if (opportunityDate.getTime() <= new Date().getTime()) {
    throw new Error("Opportunity date must be in the future");
  }

  const { supabase, ngo } = await requireOwnedNgo();
  const { error } = await supabase.from("volunteer_opportunities").insert({
    ngo_id: ngo.id,
    title: values.title,
    description: values.description,
    city: values.city,
    required_skills: [...new Set(values.requiredSkills)],
    availability: [...new Set(values.availability)],
    date: opportunityDate.toISOString(),
    total_needed: values.totalNeeded,
    status: "active",
  });

  if (error) {
    throw new Error("The volunteer opportunity could not be created");
  }

  revalidatePath("/ngo/dashboard/volunteers");
  revalidatePath("/volunteer/opportunities");
}

export async function reviewVolunteerApplicationAction(input: unknown) {
  const values = z
    .object({
      applicationId: z.string().uuid(),
      status: z.enum(["shortlisted", "accepted", "rejected"]),
    })
    .parse(input);
  const { supabase } = await requireOwnedNgo();
  const { error } = await supabase.rpc("review_volunteer_application", {
    application_uuid: values.applicationId,
    next_status: values.status,
  });

  if (error) {
    throw new Error("The application decision could not be saved");
  }

  revalidatePath("/ngo/dashboard/volunteers");
  revalidatePath("/volunteer/dashboard");
}

export async function reviewVolunteerApplicationFormAction(formData: FormData) {
  return reviewVolunteerApplicationAction({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
  });
}

export async function reviewVolunteerHoursAction(input: unknown) {
  const values = z
    .object({
      hoursId: z.string().uuid(),
      status: z.enum(["approved", "rejected"]),
      note: z.string().trim().max(500).optional(),
    })
    .parse(input);
  const { supabase } = await requireOwnedNgo();
  // The database transition atomically updates verified skills and issues the
  // volunteer certificate when approved hours make the volunteer eligible.
  const { error } = await supabase.rpc("review_volunteer_hours", {
    hours_uuid: values.hoursId,
    next_status: values.status,
    decision_note: values.note ?? null,
  });

  if (error) {
    throw new Error("The hours decision could not be saved");
  }

  revalidatePath("/ngo/dashboard/volunteers");
  revalidatePath("/volunteer/dashboard");
}

export async function reviewVolunteerHoursFormAction(formData: FormData) {
  return reviewVolunteerHoursAction({
    hoursId: formData.get("hoursId"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
}

export async function updateVolunteerOpportunityStatusFormAction(
  formData: FormData,
) {
  const values = z
    .object({
      opportunityId: z.string().uuid(),
      status: z.enum(["active", "closed", "cancelled"]),
    })
    .parse({
      opportunityId: formData.get("opportunityId"),
      status: formData.get("status"),
    });
  const { supabase, ngo } = await requireOwnedNgo();
  const { error } = await supabase
    .from("volunteer_opportunities")
    .update({ status: values.status, updated_at: new Date().toISOString() })
    .eq("id", values.opportunityId)
    .eq("ngo_id", ngo.id);

  if (error) {
    throw new Error("The opportunity status could not be changed");
  }

  revalidatePath("/ngo/dashboard/volunteers");
  revalidatePath("/volunteer/opportunities");
}
