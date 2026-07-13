"use client";

import { useState, useEffect } from "react";
import type { PostWithAuthor } from "@/lib/services/posts";
import type { PostCategory, PostAuthorRole } from "@/lib/types/database.types";
import EnhancedPostCard from "./EnhancedPostCard";
import FeedFilters from "./FeedFilters";

interface EnhancedPostFeedProps {
  initialPosts: PostWithAuthor[];
  userId: string;
}

export default function EnhancedPostFeed({
  initialPosts,
  userId,
}: EnhancedPostFeedProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [filteredPosts, setFilteredPosts] =
    useState<PostWithAuthor[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (filters: {
    category?: PostCategory;
    authorRole?: PostAuthorRole;
    search?: string;
  }) => {
    let filtered = [...posts];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter((post) => post.category === filters.category);
    }

    // Apply author role filter
    if (filters.authorRole) {
      filtered = filtered.filter(
        (post) => post.author_role === filters.authorRole,
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.content.toLowerCase().includes(searchTerm),
      );
    }

    setFilteredPosts(filtered);
  };

  return (
    <>
      <FeedFilters onFilterChange={handleFilterChange} />

      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No posts found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or search terms to see more results.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <EnhancedPostCard key={post.id} post={post} userId={userId} />
          ))}
        </div>
      )}
    </>
  );
}
