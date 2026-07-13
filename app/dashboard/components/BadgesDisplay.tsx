"use client";

import { useState, useEffect } from "react";
import { BADGE_INFO } from "@/lib/services/badges";
import type { UserBadge } from "@/lib/types/database.types";

interface BadgesDisplayProps {
  userId: string;
}

export default function BadgesDisplay({ userId }: BadgesDisplayProps) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await fetch(`/api/badges/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setBadges(data);
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Badges
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Badges
        </h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🏅</div>
          <p className="text-gray-600 text-sm">
            Complete more actions to earn badges!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Badges</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map((badge) => {
          const badgeInfo = BADGE_INFO[badge.badge_type];
          return (
            <div
              key={badge.id}
              className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
            >
              <div className="text-3xl mb-2">{badgeInfo.emoji}</div>
              <p className="text-sm font-semibold text-gray-900 text-center">
                {badgeInfo.name}
              </p>
              <p className="text-xs text-gray-600 text-center mt-1">
                {badgeInfo.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
