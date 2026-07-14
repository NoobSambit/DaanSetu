"use client";

import { useState, useEffect } from "react";
interface Donor {
  id: string;
  amountPaise: number;
  is_anonymous: boolean;
  capturedAt: string;
  name: string;
}

export default function CampaignDonors({ campaignId }: { campaignId: string }) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDonors();
  }, [campaignId]);

  const loadDonors = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/supporters`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Supporters could not be loaded");
      const data = (await response.json()) as { donors: Donor[] };
      setDonors(data.donors);
    } catch {
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-5">
        Supporters ({donors.length})
      </h3>

      {loading ? (
        <div className="text-center py-12">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      ) : donors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">💝</div>
          <p className="text-slate-600 font-medium">
            No donations yet. Be the first to support!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
          {donors.map((donor) => (
            <div
              key={donor.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {donor.is_anonymous ? "Anonymous" : donor.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(donor.capturedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-600">
                ₹{(donor.amountPaise / 100).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
