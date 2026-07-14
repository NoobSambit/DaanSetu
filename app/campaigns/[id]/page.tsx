import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import DonateButton from "@/components/DonateButton";
import CampaignProgress from "@/components/CampaignProgress";
import CampaignDonors from "@/components/CampaignDonors";
import CampaignUpdates from "@/components/CampaignUpdates";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch campaign with NGO details
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      ngos (
        id,
        name,
        city,
        state,
        category
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !campaign) {
    notFound();
  }

  const { data: payoutAccount } = campaign.payout_account_id
    ? await supabase
        .from("payout_accounts")
        .select("status")
        .eq("id", campaign.payout_account_id)
        .maybeSingle()
    : { data: null };

  const ngo = campaign.ngos as {
    id: string;
    name: string;
    city: string;
    state: string;
    category: string;
  } | null;
  const beneficiary = campaign.beneficiary as {
    name?: string;
  } | null;
  const beneficiaryName = ngo?.name ?? beneficiary?.name ?? "Community cause";
  const canDonate =
    campaign.status === "active" &&
    payoutAccount?.status === "active" &&
    new Date(campaign.deadline).getTime() > new Date().getTime();

  const categoryEmojis: Record<string, string> = {
    education: "📚",
    food: "🍲",
    health: "🏥",
    women: "👩",
    animals: "🐾",
    disaster: "🆘",
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const endDate = new Date(deadline);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(campaign.deadline);
  const progress = Math.min(
    (campaign.raised_paise / campaign.target_paise) * 100,
    100,
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/campaigns"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Back to Campaigns
          </Link>
          {campaign.creator_id === user?.id && (
            <Link
              href={`/campaigns/${campaign.id}/manage`}
              className="ml-4 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Manage campaign
            </Link>
          )}
        </div>

        {/* Campaign Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {/* Cover Image */}
          {campaign.image_url && (
            <div className="relative h-96">
              <img
                src={campaign.image_url}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Category Badge */}
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                {categoryEmojis[campaign.category]}{" "}
                {campaign.category.charAt(0).toUpperCase() +
                  campaign.category.slice(1)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {campaign.title}
            </h1>

            {/* NGO Info */}
            {ngo ? (
              <Link
                href={`/ngos/${ngo.id}`}
                className="text-blue-600 hover:text-blue-700 font-medium mb-6 inline-block"
              >
                by {ngo.name} • {ngo.city}, {ngo.state}
              </Link>
            ) : (
              <p className="mb-6 font-medium text-blue-700">
                Supporter-led fundraiser for {beneficiaryName}
              </p>
            )}

            {/* Short Description */}
            <p className="text-xl text-gray-700 mb-6">
              {campaign.short_description}
            </p>

            {/* Progress Section */}
            <CampaignProgress
              currentAmount={campaign.raised_paise / 100}
              goalAmount={campaign.target_paise / 100}
              progress={progress}
              daysRemaining={daysRemaining}
            />

            {/* Donate Button */}
            <div className="mt-6">
              {canDonate ? (
                <DonateButton
                  ngoId={campaign.ngo_id}
                  ngoName={beneficiaryName}
                  isAuthenticated={!!user}
                  campaignId={campaign.id}
                  campaignTitle={campaign.title}
                />
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Donations are unavailable until this fundraiser is approved,
                  active, and connected to an active payout recipient.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Description */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            About This Campaign
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {campaign.description}
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Donors List */}
          <CampaignDonors campaignId={campaign.id} />

          {/* Campaign Updates */}
          <CampaignUpdates
            campaignId={campaign.id}
            canPost={campaign.creator_id === user?.id}
          />
        </div>
      </div>
    </div>
  );
}
