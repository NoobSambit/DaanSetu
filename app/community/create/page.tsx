import { redirect } from "next/navigation";

import CommunityPostComposer from "@/app/community/create/CommunityPostComposer";
import { createClient } from "@/lib/supabase/server";

export default async function CreatePostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/community/create");
  }
  if (!user.email_confirmed_at) {
    redirect("/check-email?type=signup");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Community
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#10214e]">
          Publish a post
        </h1>
        <p className="mt-2 text-slate-600">
          Share a factual update, impact story, or announcement with the
          DaanSetu community.
        </p>
        <CommunityPostComposer />
      </section>
    </main>
  );
}
