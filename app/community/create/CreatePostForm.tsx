"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { POST_CATEGORIES, POST_CATEGORY_LABELS } from "@/lib/services/posts";
import type { PostCategory, PostAuthorRole } from "@/lib/types/database.types";

interface CreatePostFormProps {
  userId: string;
  userRole: string;
}

export default function CreatePostForm({
  userId,
  userRole,
}: CreatePostFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    category: "update" as PostCategory,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          author_id: userId,
          author_role: userRole as PostAuthorRole,
        }),
      });

      if (response.ok) {
        router.push("/community");
        router.refresh();
      } else {
        alert("Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm p-6 space-y-6"
    >
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Title *
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Give your post a catchy title..."
          maxLength={200}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.title.length}/200
        </p>
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Category *
        </label>
        <select
          id="category"
          required
          value={formData.category}
          onChange={(e) =>
            setFormData({
              ...formData,
              category: e.target.value as PostCategory,
            })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {POST_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {POST_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Content *
        </label>
        <textarea
          id="content"
          required
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          rows={10}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Share your story, update, or announcement..."
          maxLength={5000}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.content.length}/5000
        </p>
      </div>

      {/* Image URL (Optional) */}
      <div>
        <label
          htmlFor="image_url"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Image URL (Optional)
        </label>
        <input
          type="url"
          id="image_url"
          value={formData.image_url}
          onChange={(e) =>
            setFormData({ ...formData, image_url: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-sm text-gray-500 mt-1">
          Add an image to make your post more engaging
        </p>
      </div>

      {/* Image Preview */}
      {formData.image_url && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Image Preview
          </p>
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={formData.image_url}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? "Publishing..." : "Publish Post"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
