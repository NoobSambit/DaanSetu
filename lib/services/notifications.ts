import { createClient } from '@/lib/supabase/server'
import type { Notification, NotificationType } from '@/lib/types/database.types'

export interface CreateNotificationData {
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

// Create a notification
export async function createNotification(data: CreateNotificationData): Promise<Notification> {
  const supabase = await createClient()

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    throw new Error('Failed to create notification')
  }

  return notification
}

// Get notifications for a user
export async function getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const supabase = await createClient()

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return notifications || []
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }

  return count || 0
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Failed to mark notification as read')
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw new Error('Failed to mark all notifications as read')
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    throw new Error('Failed to delete notification')
  }
}

// Delete all notifications for a user
export async function deleteAllNotifications(userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting all notifications:', error)
    throw new Error('Failed to delete all notifications')
  }
}

// Helper functions to create specific notifications

export async function notifyCampaignMilestone(
  userId: string,
  campaignTitle: string,
  milestone: string,
  campaignId: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'campaign_milestone',
    title: 'Campaign Milestone Reached!',
    message: `${campaignTitle} has reached ${milestone}`,
    link: `/campaigns/${campaignId}`
  })
}

export async function notifyVolunteerAccepted(
  userId: string,
  opportunityTitle: string,
  opportunityId: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'volunteer_accepted',
    title: 'Volunteer Application Accepted!',
    message: `Your application for "${opportunityTitle}" has been accepted`,
    link: `/volunteer/opportunities`
  })
}

export async function notifyBadgeUnlocked(
  userId: string,
  badgeName: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'badge_unlocked',
    title: 'New Badge Unlocked!',
    message: `Congratulations! You've earned the "${badgeName}" badge`,
    link: `/dashboard`
  })
}

export async function notifyPostLiked(
  userId: string,
  likerName: string,
  postId: string,
  postTitle: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'post_liked',
    title: 'Someone liked your post',
    message: `${likerName} liked your post "${postTitle}"`,
    link: `/community`
  })
}

export async function notifyPostCommented(
  userId: string,
  commenterName: string,
  postId: string,
  postTitle: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'post_commented',
    title: 'New comment on your post',
    message: `${commenterName} commented on your post "${postTitle}"`,
    link: `/community`
  })
}

export async function notifyPartnershipAccepted(
  userId: string,
  campaignTitle: string,
  corporateName: string,
  campaignId: string
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'partnership_accepted',
    title: 'Partnership Request Accepted!',
    message: `${corporateName} accepted your partnership request for "${campaignTitle}"`,
    link: `/csr-campaigns/${campaignId}`
  })
}
