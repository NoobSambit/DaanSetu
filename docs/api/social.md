# Social API

Social features including posts, likes, comments, follows, and bookmarks.

## Overview

**Base Path**: `/api/posts/`, `/api/follows/`, `/api/bookmarks/`

**Rate Limit**: 100 requests per minute

**Authentication**: Required for most endpoints

## Posts

### Create Post

Create a new social media post.

**Endpoint**: `POST /api/posts/create`

**Request Body**:
```typescript
{
  content: string          // Post content (1-5000 characters)
  image_url?: string      // Optional image URL
  hashtags?: string[]     // Optional hashtags
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/posts/create \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "content": "Excited to support education initiatives! #education #impact",
    "hashtags": ["education", "impact"]
  }'
```

**Response**:
```json
{
  "post": {
    "id": "uuid",
    "user_id": "uuid",
    "content": "Excited to support education initiatives!",
    "hashtags": ["education", "impact"],
    "likes_count": 0,
    "comments_count": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Like Post

Like or unlike a post.

**Endpoint**: `POST /api/posts/like`

**Request Body**:
```typescript
{
  postId: string
}
```

**Response**:
```json
{
  "success": true,
  "action": "liked",  // or "unliked"
  "likesCount": 42
}
```

### Comment on Post

Add a comment to a post.

**Endpoint**: `POST /api/posts/comment`

**Request Body**:
```typescript
{
  postId: string
  content: string  // Comment text (1-1000 characters)
}
```

**Response**:
```json
{
  "comment": {
    "id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid",
    "content": "Great initiative!",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get Post Comments

Retrieve all comments for a post.

**Endpoint**: `GET /api/posts/[postId]/comments`

**Response**:
```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "Great initiative!",
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": "uuid",
        "name": "John Doe"
      }
    }
  ]
}
```

## Follows

### Toggle Follow

Follow or unfollow an NGO.

**Endpoint**: `POST /api/follows/toggle`

**Request Body**:
```typescript
{
  ngoId: string
}
```

**Response**:
```json
{
  "success": true,
  "action": "followed",  // or "unfollowed"
  "followsCount": 150
}
```

### Check Follow Status

Check if user follows an NGO.

**Endpoint**: `GET /api/follows/check?ngoId=uuid`

**Response**:
```json
{
  "isFollowing": true
}
```

## Bookmarks

### Toggle Bookmark

Bookmark or unbookmark a campaign/NGO.

**Endpoint**: `POST /api/bookmarks/toggle`

**Request Body**:
```typescript
{
  entityType: 'campaign' | 'ngo'
  entityId: string
}
```

**Response**:
```json
{
  "success": true,
  "action": "bookmarked"  // or "removed"
}
```

### Check Bookmark Status

**Endpoint**: `GET /api/bookmarks/check?entityType=campaign&entityId=uuid`

**Response**:
```json
{
  "isBookmarked": true
}
```

## Notifications

### Mark as Read

**Endpoint**: `POST /api/notifications/mark-read`

**Request Body**:
```typescript
{
  notificationId: string
}
```

### Mark All as Read

**Endpoint**: `POST /api/notifications/mark-all-read`

**Response**:
```json
{
  "success": true,
  "count": 5
}
```

### Delete Notification

**Endpoint**: `DELETE /api/notifications/delete`

**Request Body**:
```typescript
{
  notificationId: string
}
```

## Next Steps

- [API Overview](./overview.md) - Complete API reference
- [Social Features](../features/social-features.md) - Social features guide
- [Authentication](./authentication.md) - Auth flows
