import { redirect } from "next/navigation";

import SupporterShell from "@/app/dashboard/components/SupporterShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function SupporterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?next=/dashboard");

  const reader = createAdminClient();
  const [
    { data: account },
    { count: unreadNotifications },
    { count: previewFixtureCount },
    { data: recentDonations },
    { data: recentVolunteerHours },
  ] = await Promise.all([
    reader.from("users").select("name").eq("id", user.id).maybeSingle(),
    reader
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
    reader
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_demo", true)
      .contains("metadata", { dashboard_fixture: "supporter-dashboard-v1" }),
    reader
      .from("donations")
      .select("created_at, captured_at")
      .eq("user_id", user.id)
      .eq("is_demo", false)
      .order("created_at", { ascending: false })
      .limit(30),
    reader
      .from("volunteer_hours")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30),
  ]);
  const activeDates = new Set(
    [
      ...(recentDonations ?? []).map((donation) =>
        (donation.captured_at ?? donation.created_at).slice(0, 10),
      ),
      ...(recentVolunteerHours ?? []).map((entry) => entry.date.slice(0, 10)),
    ].filter(Boolean),
  );
  const streakDays =
    (previewFixtureCount ?? 0) > 0 ? 12 : Math.min(30, activeDates.size);

  return (
    <SupporterShell
      name={account?.name?.trim() || user.email?.split("@")[0] || "Supporter"}
      email={user.email ?? ""}
      unreadNotifications={unreadNotifications ?? 0}
      streakDays={streakDays}
    >
      {children}
    </SupporterShell>
  );
}
