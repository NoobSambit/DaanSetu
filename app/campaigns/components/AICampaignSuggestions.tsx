"use client";

import { useState } from "react";
import Link from "next/link";

interface CampaignSuggestion {
  campaign_id: string;
  campaign_title: string;
  reason: string;
  category: string;
  short_description: string;
}

export default function AICampaignSuggestions() {
  const [suggestions, setSuggestions] = useState<CampaignSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    setShowSuggestions(true);

    try {
      const response = await fetch("/api/ai/recommend-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch campaign suggestions");
      }

      const data = await response.json();
      setSuggestions(data.recommendations || []);
    } catch (err) {
      setError("Unable to load campaign suggestions. Please try again.");
      console.error("Error fetching campaign suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const categoryEmojis: Record<string, string> = {
    education: "📚",
    food: "🍲",
    health: "🏥",
    women: "👩",
    animals: "🐾",
    disaster: "🆘",
  };

  const categoryColors: Record<string, string> = {
    education: "bg-blue-100 text-blue-800",
    food: "bg-orange-100 text-orange-800",
    health: "bg-red-100 text-red-800",
    women: "bg-purple-100 text-purple-800",
    animals: "bg-green-100 text-green-800",
    disaster: "bg-yellow-100 text-yellow-800",
  };

  if (!showSuggestions) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Find Campaigns Perfect for You
            </h2>
            <p className="text-blue-100">
              Let AI suggest campaigns based on your interests and donation
              history
            </p>
          </div>
          <button
            onClick={fetchSuggestions}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2 whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Find Campaigns For Me
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Campaigns Recommended for You
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered suggestions based on your interests
          </p>
        </div>
        <button
          onClick={() => setShowSuggestions(false)}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">
            Finding perfect campaigns for you...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-medium">
            No matching campaigns found at the moment.
          </p>
          <p className="text-sm mt-2">Try browsing all campaigns below!</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="border-2 border-blue-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-md transition bg-blue-50/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[suggestion.category] || "bg-gray-100 text-gray-800"}`}
                >
                  {categoryEmojis[suggestion.category]} {suggestion.category}
                </span>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">
                  AI Pick
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                {suggestion.campaign_title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {suggestion.short_description}
              </p>
              <div className="bg-white rounded-lg p-3 mb-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-900 mb-1">
                  Why this campaign?
                </p>
                <p className="text-xs text-gray-700">{suggestion.reason}</p>
              </div>
              <Link
                href={`/campaigns/${suggestion.campaign_id}`}
                className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                View Campaign
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
