"use client";

import { useState, useEffect } from "react";
import type { PostWithAuthor, PostCommentWithUser } from "@/lib/services/posts";
import { POST_CATEGORY_LABELS } from "@/lib/services/posts";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface EnhancedPostCardProps {
  post: PostWithAuthor;
  userId: string;
}

export default function EnhancedPostCard({
  post,
  userId,
}: EnhancedPostCardProps) {
  const [isLiked, setIsLiked] = useState(post.user_has_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostCommentWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    checkBookmarkStatus();
  }, []);

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/bookmarks/check?postId=${post.id}`);
      const data = await response.json();
      setIsBookmarked(data.isBookmarked);
    } catch (error) {
      console.error("Error checking bookmark:", error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          action: isLiked ? "unlike" : "like",
        }),
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await fetch("/api/bookmarks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleShare = (platform: string) => {
    const postUrl = `${window.location.origin}/community/posts/${post.id}`;
    const text = `Check out this post: ${post.title}`;

    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + postUrl)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(postUrl);
        alert("Link copied to clipboard!");
        setShowShareMenu(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      setShowShareMenu(false);
    }
  };

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }

    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
        setShowComments(true);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/posts/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, content: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setCommentCount(commentCount + 1);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryColors: Record<string, string> = {
    update: "bg-blue-100 text-blue-800",
    story: "bg-green-100 text-green-800",
    announcement: "bg-purple-100 text-purple-800",
  };

  const roleLabels: Record<string, string> = {
    ngo: "NGO",
    corporate: "Corporate",
    admin: "Admin",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Post Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${post.author_id}`}>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200 transition">
                <span className="text-blue-600 font-semibold text-sm">
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </Link>
            <div>
              <Link href={`/profile/${post.author_id}`}>
                <p className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                  {post.author.name}
                </p>
              </Link>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {roleLabels[post.author_role]}
                </span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.is_featured && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                ⭐ Featured
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[post.category]}`}
            >
              {POST_CATEGORY_LABELS[post.category]}
            </span>
          </div>
        </div>

        {/* Post Content */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>

        {/* Post Image */}
        {post.image_url && (
          <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
          <span>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </span>
          <span>
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </span>
          {post.view_count !== undefined && (
            <span>👁️ {post.view_count} views</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                isLiked
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>Like</span>
            </button>
            <button
              onClick={loadComments}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>Comment</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition ${
                isBookmarked
                  ? "text-yellow-600 bg-yellow-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Bookmark post"}
            >
              <svg
                className="w-5 h-5"
                fill={isBookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>

            {/* Share Button */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                title="Share post"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>

              {/* Share Menu */}
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => handleShare("twitter")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    🐦 Share on Twitter
                  </button>
                  <button
                    onClick={() => handleShare("linkedin")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    💼 Share on LinkedIn
                  </button>
                  <button
                    onClick={() => handleShare("whatsapp")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    💬 Share on WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare("copy")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-t border-gray-200"
                  >
                    🔗 Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mb-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Link href={`/profile/${comment.user_id}`}>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-gray-200">
                        <span className="text-gray-600 font-semibold text-xs">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link href={`/profile/${comment.user_id}`}>
                          <span className="font-semibold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">
                            {comment.user.name}
                          </span>
                        </Link>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
