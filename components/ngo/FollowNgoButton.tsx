"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toggleFollowAction } from "@/app/follows/actions";

interface FollowNgoButtonProps {
  ngoId: string;
  initialFollowerCount?: number;
  isAuthenticated?: boolean;
  className?: string;
}

export default function FollowNgoButton({
  ngoId,
  initialFollowerCount = 0,
  isAuthenticated = false,
  className,
}: FollowNgoButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);

  useEffect(() => {
    if (isAuthenticated) {
      checkFollowStatus();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, ngoId]);

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(
        `/api/follows/check?targetId=${ngoId}&targetType=ngo`,
      );
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      window.location.href = `/sign-in?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsLoading(true);
    try {
      const result = await toggleFollowAction({
        targetId: ngoId,
        targetType: "ngo",
      });
      setIsFollowing(result.isFollowing);
      setFollowerCount((previous) =>
        result.isFollowing ? previous + 1 : Math.max(0, previous - 1),
      );
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={isLoading}
      className={`${className || "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"} ${
        isFollowing
          ? "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200"
          : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
      } disabled:opacity-50`}
    >
      <Heart
        className={`h-4 w-4 ${isFollowing ? "fill-slate-500 text-slate-500" : ""}`}
      />
      <span>
        {isLoading
          ? "Loading..."
          : isFollowing
            ? "Following"
            : "Follow Organization"}
      </span>
    </button>
  );
}
