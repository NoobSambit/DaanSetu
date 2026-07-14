"use client";

import { useState, useEffect } from "react";
import { createCampaignUpdateAction } from "@/app/campaigns/actions";
import { getCampaignUpdates } from "@/lib/services/campaigns";
import type { CampaignUpdate } from "@/lib/types/database.types";

interface CampaignUpdatesProps {
  campaignId: string;
  canPost: boolean;
}

export default function CampaignUpdates({
  campaignId,
  canPost,
}: CampaignUpdatesProps) {
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadUpdates();
  }, [campaignId]);

  const loadUpdates = async () => {
    try {
      const data = await getCampaignUpdates(campaignId);
      setUpdates(data);
    } catch (error) {
      console.error("Failed to load updates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUpdate.trim()) return;

    setPosting(true);
    try {
      await createCampaignUpdateAction({
        campaignId,
        text: newUpdate.trim(),
      });
      setNewUpdate("");
      setShowForm(false);
      await loadUpdates();
    } catch (error) {
      console.error("Failed to post update:", error);
      alert("Failed to post update");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-slate-900">
          Campaign Updates ({updates.length})
        </h3>
        {canPost && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary text-sm"
          >
            Post Update
          </button>
        )}
      </div>

      {/* Post Update Form */}
      {canPost && showForm && (
        <form
          onSubmit={handlePostUpdate}
          className="mb-6 border-2 border-blue-200 bg-blue-50 rounded-xl p-4"
        >
          <textarea
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            placeholder="Share an update about this campaign..."
            rows={4}
            className="input mb-3"
            disabled={posting}
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={posting || !newUpdate.trim()}
              className="btn btn-primary"
            >
              {posting ? "Posting..." : "Post Update"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewUpdate("");
              }}
              disabled={posting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Updates List */}
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
      ) : updates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📢</div>
          <p className="text-slate-600 font-medium">No updates yet</p>
        </div>
      ) : (
        <div className="space-y-5 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
          {updates.map((update) => (
            <div
              key={update.id}
              className="border-b border-slate-200 pb-5 last:border-b-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-slate-500 font-medium">
                  {new Date(update.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {update.text}
              </p>
              {update.image_url && (
                <img
                  src={update.image_url}
                  alt="Update"
                  className="mt-3 rounded-lg max-w-full shadow-md"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
