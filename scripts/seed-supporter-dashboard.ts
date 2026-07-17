import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const TARGET_EMAIL = "sambitpradhan.dev2004@gmail.com";
const DASHBOARD_FIXTURE = "supporter-dashboard-v1";
const DAY = 24 * 60 * 60 * 1_000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function deterministicUuid(seed: string) {
  const value = createHash("md5").update(seed).digest("hex");
  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20),
  ].join("-");
}

function dateFromNow(days: number) {
  return new Date(Date.now() + days * DAY).toISOString();
}

async function requireUser() {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1_000,
  });
  if (error) throw error;

  const user = data.users.find((candidate) => candidate.email === TARGET_EMAIL);
  if (!user) {
    throw new Error(`No authenticated user exists for ${TARGET_EMAIL}.`);
  }
  return user;
}

async function main() {
  const user = await requireUser();
  const [
    { data: ngos, error: ngosError },
    { data: campaigns, error: campaignsError },
    { data: posts, error: postsError },
  ] = await Promise.all([
    supabase
      .from("ngos")
      .select("id, name, city")
      .eq("profile_status", "published")
      .eq("is_discoverable", true)
      .order("beneficiaries_reached", { ascending: false })
      .limit(8),
    supabase
      .from("campaigns")
      .select("id, ngo_id, title")
      .eq("status", "active")
      .not("ngo_id", "is", null)
      .order("deadline", { ascending: true })
      .limit(5),
    supabase
      .from("posts")
      .select("id")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(2),
  ]);

  if (ngosError) throw ngosError;
  if (campaignsError) throw campaignsError;
  if (postsError) throw postsError;
  if (!ngos || ngos.length < 8) {
    throw new Error("At least eight published NGOs are required.");
  }
  if (!campaigns || campaigns.length < 5) {
    throw new Error("At least five active NGO campaigns are required.");
  }

  const opportunitySeeds = [
    {
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:opportunity:1`),
      ngo_id: ngos[0].id,
      title: "Teaching Assistant for Digital Literacy",
      description:
        "Help young learners build practical digital skills in a guided community workshop.",
      city: ngos[0].city ?? "Bengaluru",
      date: dateFromNow(12),
      required_skills: ["Teaching", "Digital Literacy"],
      availability: ["Weekends"],
      total_needed: 8,
      status: "active",
    },
    {
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:opportunity:2`),
      ngo_id: ngos[1].id,
      title: "Community Health Camp Volunteer",
      description:
        "Support registrations, attendee guidance, and community outreach for a local health camp.",
      city: ngos[1].city ?? "Pune",
      date: dateFromNow(20),
      required_skills: ["Community Outreach", "Coordination"],
      availability: ["Weekdays", "Weekends"],
      total_needed: 12,
      status: "active",
    },
  ];

  const { error: opportunityError } = await supabase
    .from("volunteer_opportunities")
    .upsert(opportunitySeeds, { onConflict: "id" });
  if (opportunityError) throw opportunityError;

  const donationAmounts = [
    200_000, 175_000, 150_000, 149_000, 140_000, 130_000, 160_000, 150_000,
  ];
  const donationCauses = [
    "education",
    "healthcare",
    "general",
    "disaster",
    "education",
    "healthcare",
    "general",
    "education",
  ];
  const donationDaysAgo = [8, 22, 37, 54, 73, 91, 112, 136];
  const donations = donationAmounts.map((amount, index) => {
    const capturedAt = dateFromNow(-donationDaysAgo[index]);
    const campaign = campaigns[index % campaigns.length];
    const ngo = ngos[index];
    return {
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:donation:${index + 1}`),
      user_id: user.id,
      ngo_id: ngo.id,
      campaign_id: campaign.id,
      amount_paise: amount,
      refunded_paise: 0,
      provider: "paypal",
      gateway_order_id: `DASHBOARD-PREVIEW-ORDER-${index + 1}-${user.id}`,
      gateway_payment_id: `DASHBOARD-PREVIEW-CAPTURE-${index + 1}-${user.id}`,
      payment_method: "demo_preview",
      status: "captured",
      is_anonymous: false,
      is_demo: true,
      is_csr_match: false,
      cause: donationCauses[index],
      receipt_number: `DS-PREVIEW-${String(index + 1).padStart(4, "0")}`,
      metadata: {
        dashboard_fixture: DASHBOARD_FIXTURE,
        synthetic: true,
        preview_only: true,
      },
      captured_at: capturedAt,
      created_at: capturedAt,
    };
  });
  const { error: donationsError } = await supabase
    .from("donations")
    .upsert(donations, { onConflict: "id" });
  if (donationsError) throw donationsError;

  const applications = opportunitySeeds.map((opportunity, index) => ({
    id: deterministicUuid(`${DASHBOARD_FIXTURE}:application:${index + 1}`),
    user_id: user.id,
    opportunity_id: opportunity.id,
    status: index === 0 ? "accepted" : "submitted",
    message:
      "Dashboard preview fixture for the supporter volunteering journey.",
    applied_at: dateFromNow(-(18 + index * 24)),
  }));
  const { error: applicationError } = await supabase
    .from("volunteer_applications")
    .upsert(applications, { onConflict: "id" });
  if (applicationError) throw applicationError;

  const volunteerHours = [
    {
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:hours:1`),
      user_id: user.id,
      opportunity_id: opportunitySeeds[0].id,
      ngo_id: opportunitySeeds[0].ngo_id,
      hours: 20,
      date: dateFromNow(-64).slice(0, 10),
      description: "Supported digital literacy sessions for young learners.",
      status: "approved",
      verified: true,
      verified_at: dateFromNow(-60),
    },
    {
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:hours:2`),
      user_id: user.id,
      opportunity_id: opportunitySeeds[0].id,
      ngo_id: opportunitySeeds[0].ngo_id,
      hours: 28,
      date: dateFromNow(-36).slice(0, 10),
      description: "Mentored students through practical computer exercises.",
      status: "approved",
      verified: true,
      verified_at: dateFromNow(-32),
    },
  ];
  const { error: hoursError } = await supabase
    .from("volunteer_hours")
    .upsert(volunteerHours, { onConflict: "id" });
  if (hoursError) throw hoursError;

  const follows = ngos.slice(0, 3).map((ngo, index) => ({
    id: deterministicUuid(`${DASHBOARD_FIXTURE}:follow:${index + 1}`),
    follower_id: user.id,
    following_id: ngo.id,
    following_type: "ngo",
    created_at: dateFromNow(-(5 + index * 4)),
  }));
  const { error: followsError } = await supabase
    .from("follows")
    .upsert(follows, { onConflict: "id" });
  if (followsError) throw followsError;

  const notifications = [
    {
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:notification:1`),
      user_id: user.id,
      type: "campaign_milestone",
      title: "Campaign milestone reached",
      message: "A campaign you support has crossed its next funding milestone.",
      link: `/campaigns/${campaigns[0].id}`,
      is_read: false,
      created_at: dateFromNow(-1),
    },
    {
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:notification:2`),
      user_id: user.id,
      type: "volunteer_application",
      title: "Volunteer application update",
      message: "Your digital literacy volunteering application was accepted.",
      link: "/volunteer/dashboard",
      is_read: false,
      created_at: dateFromNow(-2),
    },
    {
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:notification:3`),
      user_id: user.id,
      type: "post_liked",
      title: "New community activity",
      message: "A new impact story was shared in a cause you follow.",
      link: "/community",
      is_read: false,
      created_at: dateFromNow(-3),
    },
  ];
  const { error: notificationsError } = await supabase
    .from("notifications")
    .upsert(notifications, { onConflict: "id" });
  if (notificationsError) throw notificationsError;

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:profile`),
      user_id: user.id,
      bio: "I support transparent, community-led work across India.",
      location: "Bengaluru, Karnataka",
      avatar_url: null,
    },
    { onConflict: "user_id" },
  );
  if (profileError) throw profileError;

  const { error: volunteerProfileError } = await supabase
    .from("volunteer_profiles")
    .upsert(
      {
        id: deterministicUuid(`${DASHBOARD_FIXTURE}:volunteer-profile`),
        user_id: user.id,
        city: "Bengaluru",
        bio: "Available for teaching, digital literacy, and community events.",
        skills: ["Teaching", "Technical", "Event Support"],
        availability: ["Weekends"],
        total_hours: 48,
        verified_skills: ["Teaching"],
      },
      { onConflict: "user_id" },
    );
  if (volunteerProfileError) throw volunteerProfileError;

  if (posts?.length) {
    const bookmarks = posts.map((post, index) => ({
      id: deterministicUuid(`${DASHBOARD_FIXTURE}:bookmark:${index + 1}`),
      user_id: user.id,
      post_id: post.id,
      created_at: dateFromNow(-(index + 2)),
    }));
    const { error: bookmarksError } = await supabase
      .from("post_bookmarks")
      .upsert(bookmarks, { onConflict: "id" });
    if (bookmarksError) throw bookmarksError;
  }

  console.log(
    JSON.stringify(
      {
        email: TARGET_EMAIL,
        fixture: DASHBOARD_FIXTURE,
        seeded: {
          donations: donations.length,
          volunteerApplications: applications.length,
          volunteerHours: volunteerHours.length,
          followedOrganizations: follows.length,
          notifications: notifications.length,
          bookmarks: posts?.length ?? 0,
        },
        financialIsolation:
          "All donation fixtures use is_demo=true and preview-only metadata.",
      },
      null,
      2,
    ),
  );
}

await main();
