"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCorporateCampaign } from "@/lib/services/corporate-campaigns";
import {
  getPartnershipRequestsForCampaign,
  updatePartnershipRequestStatus,
} from "@/lib/services/partnerships";
import type { CorporateCampaignWithProfile } from "@/lib/services/corporate-campaigns";
import type { PartnershipRequestWithDetails } from "@/lib/services/partnerships";

export default function CorporateCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CorporateCampaignWithProfile | null>(
    null,
  );
  const [partnerships, setPartnerships] = useState<
    PartnershipRequestWithDetails[]
  >([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [params.id]);

  async function loadCampaign() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const campaignData = await getCorporateCampaign(params.id as string);
      if (!campaignData) {
        router.push("/corporate/campaigns");
        return;
      }

      setCampaign(campaignData);

      if (user) {
        const { data: profile } = await supabase
          .from("corporate_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profile && profile.id === campaignData.corporate_id) {
          setIsOwner(true);
          const partnershipData = await getPartnershipRequestsForCampaign(
            params.id as string,
          );
          setPartnerships(partnershipData);
        }
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePartnershipAction(
    requestId: string,
    action: "accepted" | "rejected",
  ) {
    try {
      await updatePartnershipRequestStatus(requestId, action);
      await loadCampaign();
    } catch (error) {
      console.error("Error updating partnership:", error);
    }
  }

  function getProgress() {
    if (!campaign) return 0;
    return Math.min(
      100,
      (Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100,
    );
  }

  function getDaysRemaining() {
    if (!campaign) return 0;
    const diff = new Date(campaign.deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Campaign not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/corporate/campaigns"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Campaigns
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {campaign.image_url && (
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {campaign.cause}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      campaign.status === "active"
                        ? "bg-green-100 text-green-800"
                        : campaign.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {campaign.title}
                </h1>
                <p className="text-gray-600">
                  by {campaign.corporate_profile.company_name}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Campaign Progress</span>
                <span className="font-medium text-gray-900">
                  {getProgress().toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">Raised</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{Number(campaign.current_amount).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Goal</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{Number(campaign.goal_amount).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getDaysRemaining() > 0 ? getDaysRemaining() : 0}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Campaign Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {campaign.description}
              </p>
            </div>

            {isOwner && partnerships.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Partnership Requests
                </h2>
                <div className="space-y-4">
                  {partnerships.map((partnership) => (
                    <div
                      key={partnership.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {partnership.ngo.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {partnership.ngo.category} • Created{" "}
                            {new Date(
                              partnership.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${
                            partnership.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : partnership.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {partnership.status}
                        </span>
                      </div>
                      {partnership.message && (
                        <p className="text-gray-700 text-sm mb-3">
                          {partnership.message}
                        </p>
                      )}
                      {partnership.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handlePartnershipAction(
                                partnership.id,
                                "accepted",
                              )
                            }
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handlePartnershipAction(
                                partnership.id,
                                "rejected",
                              )
                            }
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
