"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const optionalWebUrl = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value || null)
  .refine(
    (value) =>
      value === null ||
      (() => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      })(),
    "Enter a valid web address",
  );

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  bio: z
    .string()
    .trim()
    .max(2_000)
    .transform((value) => value || null),
  avatarUrl: optionalWebUrl,
  location: z
    .string()
    .trim()
    .max(120)
    .transform((value) => value || null),
  website: optionalWebUrl,
  twitterHandle: z
    .string()
    .trim()
    .max(50)
    .transform((value) => value.replace(/^@/, "") || null)
    .refine(
      (value) => value === null || /^[A-Za-z0-9_]{1,50}$/.test(value),
      "Enter a valid X handle",
    ),
  linkedinUrl: optionalWebUrl,
});

export async function saveUserProfileAction(formData: FormData) {
  const values = profileSchema.parse({
    name: formData.get("name"),
    bio: formData.get("bio"),
    avatarUrl: formData.get("avatarUrl"),
    location: formData.get("location"),
    website: formData.get("website"),
    twitterHandle: formData.get("twitterHandle"),
    linkedinUrl: formData.get("linkedinUrl"),
  });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    throw new Error("A verified account is required");
  }

  const { error } = await supabase.rpc("save_user_public_profile", {
    display_name: values.name,
    profile_bio: values.bio,
    profile_avatar_url: values.avatarUrl,
    profile_location: values.location,
    profile_website: values.website,
    profile_twitter_handle: values.twitterHandle,
    profile_linkedin_url: values.linkedinUrl,
  });

  if (error) {
    throw new Error("Your profile could not be saved");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/profile/${user.id}`);
  redirect(`/profile/${user.id}`);
}
