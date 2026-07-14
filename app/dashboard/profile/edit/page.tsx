import Link from "next/link";
import { redirect } from "next/navigation";

import { saveUserProfileAction } from "@/app/dashboard/profile/edit/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditUserProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?next=/dashboard/profile/edit");

  const [{ data: account }, { data: profile }] = await Promise.all([
    supabase.from("users").select("name").eq("id", user.id).single(),
    supabase
      .from("user_profiles")
      .select(
        "bio, avatar_url, location, website, twitter_handle, linkedin_url",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Edit your public profile
        </h1>
        <p className="mt-2 text-slate-600">
          Share only the information you want other verified DaanSetu members to
          see. Your email address is never shown here.
        </p>

        <form action={saveUserProfileAction} className="mt-8 space-y-5">
          <Field label="Display name" name="name" required>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={account?.name ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="About you" name="bio">
            <textarea
              id="bio"
              name="bio"
              rows={5}
              maxLength={2000}
              defaultValue={profile?.bio ?? ""}
              className={inputClass}
            />
          </Field>

          <Field label="Location" name="location">
            <input
              id="location"
              name="location"
              maxLength={120}
              defaultValue={profile?.location ?? ""}
              placeholder="Bhubaneswar, Odisha"
              className={inputClass}
            />
          </Field>

          <Field label="Avatar image URL" name="avatarUrl">
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              maxLength={500}
              defaultValue={profile?.avatar_url ?? ""}
              placeholder="https://…"
              className={inputClass}
            />
          </Field>

          <Field label="Website" name="website">
            <input
              id="website"
              name="website"
              type="url"
              maxLength={500}
              defaultValue={profile?.website ?? ""}
              placeholder="https://…"
              className={inputClass}
            />
          </Field>

          <Field label="X handle" name="twitterHandle">
            <input
              id="twitterHandle"
              name="twitterHandle"
              maxLength={50}
              defaultValue={profile?.twitter_handle ?? ""}
              placeholder="username"
              className={inputClass}
            />
          </Field>

          <Field label="LinkedIn profile" name="linkedinUrl">
            <input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              maxLength={500}
              defaultValue={profile?.linkedin_url ?? ""}
              placeholder="https://www.linkedin.com/in/…"
              className={inputClass}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-800"
            >
              Save profile
            </button>
            <Link
              href={`/profile/${user.id}`}
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  name,
  required = false,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
