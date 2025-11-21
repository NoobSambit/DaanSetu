'use client'

import { useState } from 'react'
import type { PostWithAuthor } from '@/lib/services/posts'
import PostCard from './PostCard'

interface PostFeedProps {
  initialPosts: PostWithAuthor[]
  userId: string
}

export default function PostFeed({ initialPosts, userId }: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts)

  const handlePostUpdate = (updatedPost: PostWithAuthor) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p))
  }

  const handlePostDelete = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId))
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-600">
          Be the first to share an update or story with the community!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          userId={userId}
          onUpdate={handlePostUpdate}
          onDelete={handlePostDelete}
        />
      ))}
    </div>
  )
}
