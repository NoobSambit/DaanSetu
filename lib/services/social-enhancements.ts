/**
 * Social Enhancement Services
 * Handles stories, polls, and events
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

export type MediaType = 'image' | 'video'
export type EventType = 'fundraiser' | 'volunteer_drive' | 'awareness' | 'workshop' | 'other'
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
export type RSVPStatus = 'going' | 'interested' | 'not_going'

export interface Story {
  id: string
  user_id: string
  user_role: string
  media_url: string
  media_type: MediaType
  caption?: string
  link_url?: string
  view_count: number
  expires_at: string
  created_at: string
}

export interface StoryView {
  id: string
  story_id: string
  viewer_id?: string
  viewed_at: string
}

export interface Poll {
  id: string
  post_id?: string
  question: string
  total_votes: number
  ends_at: string
  created_by: string
  created_at: string
}

export interface PollOption {
  id: string
  poll_id: string
  option_text: string
  vote_count: number
  option_order: number
}

export interface Event {
  id: string
  created_by: string
  creator_role: string
  title: string
  description: string
  event_type: EventType
  start_date: string
  end_date: string
  location?: string
  is_virtual: boolean
  virtual_link?: string
  max_attendees?: number
  current_attendees: number
  image_url?: string
  ngo_id?: string
  campaign_id?: string
  status: EventStatus
  created_at: string
}

export interface EventRSVP {
  id: string
  event_id: string
  user_id: string
  status: RSVPStatus
  rsvp_date: string
  attended: boolean
}

export interface CreateStoryParams {
  mediaUrl: string
  mediaType: MediaType
  caption?: string
  linkUrl?: string
}

export interface CreatePollParams {
  postId?: string
  question: string
  options: string[]
  durationHours: number
}

export interface CreateEventParams {
  title: string
  description: string
  eventType: EventType
  startDate: string
  endDate: string
  location?: string
  isVirtual?: boolean
  virtualLink?: string
  maxAttendees?: number
  imageUrl?: string
  ngoId?: string
  campaignId?: string
}

// ============================================================================
// STORIES
// ============================================================================

/**
 * Create a new story
 */
export async function createStory(
  params: CreateStoryParams,
  supabaseClient?: SupabaseClient
): Promise<Story> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Get user role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userProfile) throw new Error('User profile not found')

  // Stories expire after 24 hours
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: user.id,
      user_role: userProfile.role,
      media_url: params.mediaUrl,
      media_type: params.mediaType,
      caption: params.caption,
      link_url: params.linkUrl,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get active stories
 */
export async function getActiveStories(
  supabaseClient?: SupabaseClient
): Promise<Story[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      user:users(id, name)
    `)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get stories from a specific user/NGO/corporate
 */
export async function getUserStories(
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<Story[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Track story view
 */
export async function trackStoryView(
  storyId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Record view
  const { error: viewError } = await supabase
    .from('story_views')
    .insert({
      story_id: storyId,
      viewer_id: user?.id
    })

  if (viewError && viewError.code !== '23505') { // Ignore duplicate views
    console.error('Failed to track story view:', viewError)
  }

  // Increment view count
  const { error: incrementError } = await supabase.rpc('increment_story_views', {
    story_id: storyId
  })

  if (incrementError) {
    console.error('Failed to increment story views:', incrementError)
  }
}

/**
 * Get story viewers
 */
export async function getStoryViewers(
  storyId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('story_views')
    .select(`
      *,
      viewer:users(id, name)
    `)
    .eq('story_id', storyId)
    .order('viewed_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Delete a story
 */
export async function deleteStory(
  storyId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId)
    .eq('user_id', user.id)

  if (error) throw error
}

// ============================================================================
// POLLS
// ============================================================================

/**
 * Create a poll
 */
export async function createPoll(
  params: CreatePollParams,
  supabaseClient?: SupabaseClient
): Promise<Poll> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  if (params.options.length < 2) {
    throw new Error('Poll must have at least 2 options')
  }

  if (params.options.length > 10) {
    throw new Error('Poll cannot have more than 10 options')
  }

  // Calculate end time
  const endsAt = new Date()
  endsAt.setHours(endsAt.getHours() + params.durationHours)

  // Create poll
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      post_id: params.postId,
      question: params.question,
      ends_at: endsAt.toISOString(),
      created_by: user.id
    })
    .select()
    .single()

  if (pollError) throw pollError

  // Create poll options
  const optionsData = params.options.map((option, index) => ({
    poll_id: poll.id,
    option_text: option,
    option_order: index + 1
  }))

  const { error: optionsError } = await supabase
    .from('poll_options')
    .insert(optionsData)

  if (optionsError) throw optionsError

  return poll
}

/**
 * Get poll with options
 */
export async function getPoll(
  pollId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single()

  if (pollError) throw pollError

  const { data: options, error: optionsError } = await supabase
    .from('poll_options')
    .select('*')
    .eq('poll_id', pollId)
    .order('option_order', { ascending: true })

  if (optionsError) throw optionsError

  return {
    ...poll,
    options: options || []
  }
}

/**
 * Vote in a poll
 */
export async function voteInPoll(
  pollId: string,
  optionId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Check if poll has ended
  const { data: poll } = await supabase
    .from('polls')
    .select('ends_at')
    .eq('id', pollId)
    .single()

  if (poll && new Date(poll.ends_at) < new Date()) {
    throw new Error('This poll has ended')
  }

  // Record vote
  const { error } = await supabase
    .from('poll_votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id
    })

  if (error) {
    if (error.code === '23505') { // Already voted
      throw new Error('You have already voted in this poll')
    }
    throw error
  }

  // Increment vote counts
  await supabase.rpc('increment_poll_votes', {
    poll_id: pollId,
    option_id: optionId
  })
}

/**
 * Get user's vote in a poll
 */
export async function getUserPollVote(
  pollId: string,
  supabaseClient?: SupabaseClient
): Promise<string | null> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', pollId)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data?.option_id || null
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Create an event
 */
export async function createEvent(
  params: CreateEventParams,
  supabaseClient?: SupabaseClient
): Promise<Event> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Get user role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userProfile) throw new Error('User profile not found')

  const { data, error } = await supabase
    .from('events')
    .insert({
      created_by: user.id,
      creator_role: userProfile.role,
      title: params.title,
      description: params.description,
      event_type: params.eventType,
      start_date: params.startDate,
      end_date: params.endDate,
      location: params.location,
      is_virtual: params.isVirtual || false,
      virtual_link: params.virtualLink,
      max_attendees: params.maxAttendees,
      image_url: params.imageUrl,
      ngo_id: params.ngoId,
      campaign_id: params.campaignId,
      status: 'upcoming'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(
  eventType?: EventType,
  limit: number = 20,
  supabaseClient?: SupabaseClient
): Promise<Event[]> {
  const supabase = supabaseClient || getBrowserClient()

  let query = supabase
    .from('events')
    .select(`
      *,
      creator:users(id, name),
      ngo:ngos(id, name)
    `)
    .eq('status', 'upcoming')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)

  if (eventType) {
    query = query.eq('event_type', eventType)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get event by ID
 */
export async function getEvent(
  eventId: string,
  supabaseClient?: SupabaseClient
): Promise<Event | null> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      creator:users(id, name),
      ngo:ngos(id, name),
      campaign:campaigns(id, title)
    `)
    .eq('id', eventId)
    .single()

  if (error) return null
  return data
}

/**
 * RSVP to an event
 */
export async function rsvpToEvent(
  eventId: string,
  status: RSVPStatus,
  supabaseClient?: SupabaseClient
): Promise<EventRSVP> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Check if event is full
  const { data: event } = await supabase
    .from('events')
    .select('max_attendees, current_attendees')
    .eq('id', eventId)
    .single()

  if (event?.max_attendees && event.current_attendees >= event.max_attendees && status === 'going') {
    throw new Error('This event is full')
  }

  // Upsert RSVP
  const { data, error } = await supabase
    .from('event_rsvps')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      status
    }, {
      onConflict: 'event_id,user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user's RSVP for an event
 */
export async function getUserEventRSVP(
  eventId: string,
  supabaseClient?: SupabaseClient
): Promise<EventRSVP | null> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

/**
 * Get event attendees
 */
export async function getEventAttendees(
  eventId: string,
  status?: RSVPStatus,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  let query = supabase
    .from('event_rsvps')
    .select(`
      *,
      user:users(id, name)
    `)
    .eq('event_id', eventId)
    .order('rsvp_date', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Cancel an event
 */
export async function cancelEvent(
  eventId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled' })
    .eq('id', eventId)
    .eq('created_by', user.id)

  if (error) throw error
}

/**
 * Mark attendee as attended
 */
export async function markAttendance(
  rsvpId: string,
  attended: boolean,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { error } = await supabase
    .from('event_rsvps')
    .update({ attended })
    .eq('id', rsvpId)

  if (error) throw error
}
