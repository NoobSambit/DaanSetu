import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserNotifications } from "@/lib/services/notifications";
import { PageHeader } from "@/components/ui/PagePrimitives";
import NotificationList from "./components/NotificationList";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user notifications
  const notifications = await getUserNotifications(user.id, 50, supabase);

  return (
    <main className="page-frame">
      <div className="page-content max-w-3xl">
        <PageHeader
          eyebrow="Your account"
          title="Notifications"
          description="Stay on top of campaign activity, community milestones, and opportunities that need your attention."
        />
        <NotificationList initialNotifications={notifications} />
      </div>
    </main>
  );
}
