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
    (campaign.current_amount / campaign.goal_amount) * 100,
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
            <Link
              href={`/ngos/${campaign.ngos.id}`}
              className="text-blue-600 hover:text-blue-700 font-medium mb-6 inline-block"
            >
              by {campaign.ngos.name} • {campaign.ngos.city},{" "}
              {campaign.ngos.state}
            </Link>

            {/* Short Description */}
            <p className="text-xl text-gray-700 mb-6">
              {campaign.short_description}
            </p>

            {/* Progress Section */}
            <CampaignProgress
              currentAmount={campaign.current_amount}
              goalAmount={campaign.goal_amount}
              progress={progress}
              daysRemaining={daysRemaining}
            />

            {/* Donate Button */}
            <div className="mt-6">
              <DonateButton
                ngoId={campaign.ngo_id}
                ngoName={campaign.ngos.name}
                isAuthenticated={!!user}
                campaignId={campaign.id}
                campaignTitle={campaign.title}
              />
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
          <CampaignUpdates campaignId={campaign.id} ngoId={campaign.ngo_id} />
        </div>
      </div>
    </div>
  );
}
