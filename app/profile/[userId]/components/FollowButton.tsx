"use client";

import { useState, useEffect } from "react";
import { toggleFollowAction } from "@/app/follows/actions";

interface FollowButtonProps {
  currentUserId: string;
  targetUserId: string;
  targetType: "user" | "ngo" | "corporate";
}

export default function FollowButton({
  currentUserId,
  targetUserId,
  targetType,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, []);

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(
        `/api/follows/check?targetId=${targetUserId}&targetType=${targetType}`,
      );
      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const result = await toggleFollowAction({
        targetId: targetUserId,
        targetType,
      });
      setIsFollowing(result.isFollowing);
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
        isFollowing
          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
          : "bg-blue-600 text-white hover:bg-blue-700"
      } disabled:opacity-50`}
    >
      {isLoading ? "Loading..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
