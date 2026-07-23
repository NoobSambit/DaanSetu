import { redirect } from "next/navigation";

import CommunityPostComposer from "@/app/community/create/CommunityPostComposer";
import { PageHeader } from "@/components/ui/PagePrimitives";
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
    <main className="page-frame">
      <section className="page-content max-w-3xl">
        <PageHeader
          eyebrow="Community"
          title="Publish a post"
          description="Share a factual update, impact story, or announcement with the DaanSetu community."
        />
        <CommunityPostComposer />
      </section>
    </main>
  );
}
