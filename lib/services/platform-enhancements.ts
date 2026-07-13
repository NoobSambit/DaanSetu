/**
 * Platform Enhancement Services
 * Handles email/SMS notifications, full-text search, and content moderation
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export type EmailStatus = "pending" | "sent" | "failed" | "bounced";
export type SMSStatus = "pending" | "sent" | "failed";
export type ReportReason =
  "spam" | "inappropriate" | "fraud" | "harassment" | "other";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
export type EntityType = "post" | "comment" | "ngo" | "campaign" | "user";

export interface EmailQueueItem {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  html_body: string;
  text_body?: string;
  template_id?: string;
  metadata: Record<string, any>;
  status: EmailStatus;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface SMSQueueItem {
  id: string;
  recipient_phone: string;
  message: string;
  status: SMSStatus;
  attempts: number;
  sent_at?: string;
  created_at: string;
}

export interface ContentReport {
  id: string;
  reported_by: string;
  entity_type: EntityType;
  entity_id: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewed_by?: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface SearchResult {
  entity_type: "ngo" | "campaign" | "post" | "event";
  entity_id: string;
  title: string;
  description: string;
  rank: number;
}

export interface QueueEmailParams {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  templateId?: string;
  metadata?: Record<string, any>;
}

export interface QueueSMSParams {
  recipientPhone: string;
  message: string;
}

export interface CreateReportParams {
  entityType: EntityType;
  entityId: string;
  reason: ReportReason;
  description?: string;
}

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Queue an email for sending
 */
export async function queueEmail(
  params: QueueEmailParams,
  supabaseClient?: SupabaseClient,
): Promise<EmailQueueItem> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("email_queue")
    .insert({
      recipient_email: params.recipientEmail,
      recipient_name: params.recipientName,
      subject: params.subject,
      html_body: params.htmlBody,
      text_body: params.textBody,
      template_id: params.templateId,
      metadata: params.metadata || {},
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Send donation receipt email
 */
export async function sendDonationReceiptEmail(
  donationId: string,
  recipientEmail: string,
  recipientName: string,
  amount: number,
  ngoName: string,
  supabaseClient?: SupabaseClient,
) {
  const htmlBody = `
    <h1>Thank you for your donation!</h1>
    <p>Dear ${recipientName},</p>
    <p>Thank you for your generous donation of ₹${amount.toLocaleString("en-IN")} to ${ngoName}.</p>
    <p>Your support makes a real difference in the lives of those we serve.</p>
    <p>Best regards,<br/>DaanSetu Team</p>
  `;

  const textBody = `
    Thank you for your donation!
    Dear ${recipientName},
    Thank you for your generous donation of ₹${amount.toLocaleString("en-IN")} to ${ngoName}.
    Your support makes a real difference in the lives of those we serve.
    Best regards,
    DaanSetu Team
  `;

  return queueEmail(
    {
      recipientEmail,
      recipientName,
      subject: "Thank you for your donation",
      htmlBody,
      textBody,
      templateId: "donation_receipt",
      metadata: { donationId, amount, ngoName },
    },
    supabaseClient,
  );
}

/**
 * Send volunteer certificate email
 */
export async function sendVolunteerCertificateEmail(
  recipientEmail: string,
  recipientName: string,
  certificateUrl: string,
  hours: number,
  ngoName: string,
  supabaseClient?: SupabaseClient,
) {
  const htmlBody = `
    <h1>Your Volunteer Certificate</h1>
    <p>Dear ${recipientName},</p>
    <p>Congratulations! You have completed ${hours} volunteer hours with ${ngoName}.</p>
    <p><a href="${certificateUrl}">Download your certificate</a></p>
    <p>Thank you for your service!</p>
    <p>Best regards,<br/>DaanSetu Team</p>
  `;

  return queueEmail(
    {
      recipientEmail,
      recipientName,
      subject: "Your Volunteer Certificate",
      htmlBody,
      templateId: "volunteer_certificate",
      metadata: { certificateUrl, hours, ngoName },
    },
    supabaseClient,
  );
}

/**
 * Get pending emails for processing
 */
export async function getPendingEmails(
  limit: number = 100,
  supabaseClient?: SupabaseClient,
): Promise<EmailQueueItem[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("email_queue")
    .select("*")
    .eq("status", "pending")
    .lt("attempts", 3) // Max 3 attempts
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Mark email as sent
 */
export async function markEmailSent(
  emailId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const { error } = await supabase
    .from("email_queue")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", emailId);

  if (error) throw error;
}

/**
 * Mark email as failed
 */
export async function markEmailFailed(
  emailId: string,
  errorMessage: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  // Get current attempts
  const { data: email } = await supabase
    .from("email_queue")
    .select("attempts")
    .eq("id", emailId)
    .single();

  const attempts = (email?.attempts || 0) + 1;

  const { error } = await supabase
    .from("email_queue")
    .update({
      status: attempts >= 3 ? "failed" : "pending",
      attempts,
      error_message: errorMessage,
    })
    .eq("id", emailId);

  if (error) throw error;
}

// ============================================================================
// SMS NOTIFICATIONS
// ============================================================================

/**
 * Queue an SMS for sending
 */
export async function queueSMS(
  params: QueueSMSParams,
  supabaseClient?: SupabaseClient,
): Promise<SMSQueueItem> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("sms_queue")
    .insert({
      recipient_phone: params.recipientPhone,
      message: params.message,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// FULL-TEXT SEARCH
// ============================================================================

/**
 * Search across all entities
 */
export async function searchPlatform(
  query: string,
  entityTypes?: Array<"ngo" | "campaign" | "post" | "event">,
  limit: number = 20,
  supabaseClient?: SupabaseClient,
): Promise<SearchResult[]> {
  const supabase = supabaseClient || getBrowserClient();

  let dbQuery = supabase
    .from("search_index")
    .select("*")
    .textSearch("searchable_text", query, {
      type: "websearch",
      config: "english",
    })
    .limit(limit);

  if (entityTypes && entityTypes.length > 0) {
    dbQuery = dbQuery.in("entity_type", entityTypes);
  }

  const { data, error } = await dbQuery;

  if (error) throw error;

  return (data || []).map((result) => ({
    entity_type: result.entity_type,
    entity_id: result.entity_id,
    title: result.title,
    description: result.description,
    rank: 0, // Could implement ranking algorithm
  }));
}

/**
 * Update search index for an entity
 */
export async function updateSearchIndex(
  entityType: "ngo" | "campaign" | "post" | "event",
  entityId: string,
  title: string,
  description: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const { error } = await supabase.from("search_index").upsert(
    {
      entity_type: entityType,
      entity_id: entityId,
      title,
      description,
      searchable_text: `${title} ${description}`, // Will be converted to tsvector by trigger
    },
    {
      onConflict: "entity_type,entity_id",
    },
  );

  if (error) console.error("Failed to update search index:", error);
}

// ============================================================================
// CONTENT MODERATION
// ============================================================================

/**
 * Report content
 */
export async function reportContent(
  params: CreateReportParams,
  supabaseClient?: SupabaseClient,
): Promise<ContentReport> {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in");

  const { data, error } = await supabase
    .from("content_reports")
    .insert({
      reported_by: user.id,
      entity_type: params.entityType,
      entity_id: params.entityId,
      reason: params.reason,
      description: params.description,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get pending reports (Admin only)
 */
export async function getPendingReports(
  supabaseClient?: SupabaseClient,
): Promise<ContentReport[]> {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userProfile || userProfile.role !== "admin") {
    throw new Error("Only admins can view reports");
  }

  const { data, error } = await supabase
    .from("content_reports")
    .select(
      `
      *,
      reporter:users!reported_by(id, name)
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Resolve a content report
 */
export async function resolveReport(
  reportId: string,
  status: "resolved" | "dismissed",
  resolutionNotes?: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userProfile || userProfile.role !== "admin") {
    throw new Error("Only admins can resolve reports");
  }

  const { error } = await supabase
    .from("content_reports")
    .update({
      status,
      reviewed_by: user.id,
      resolution_notes: resolutionNotes,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) throw error;
}

/**
 * Get reports for a specific entity
 */
export async function getEntityReports(
  entityType: EntityType,
  entityId: string,
  supabaseClient?: SupabaseClient,
): Promise<ContentReport[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("content_reports")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Create audit log entry
 */
export async function createAuditLog(
  action: string,
  entityType?: string,
  entityId?: string,
  changes?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("audit_logs").insert({
    user_id: user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    changes,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) console.error("Failed to create audit log:", error);
}

/**
 * Get audit logs (Admin only)
 */
export async function getAuditLogs(
  userId?: string,
  action?: string,
  limit: number = 100,
  offset: number = 0,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  let query = supabase
    .from("audit_logs")
    .select(
      `
      *,
      user:users(id, name, email)
    `,
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (action) {
    query = query.eq("action", action);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// ============================================================================
// PLATFORM SETTINGS
// ============================================================================

/**
 * Get platform setting
 */
export async function getPlatformSetting(
  key: string,
  supabaseClient?: SupabaseClient,
): Promise<any> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) return null;
  return data?.value;
}

/**
 * Update platform setting (Admin only)
 */
export async function updatePlatformSetting(
  key: string,
  value: any,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userProfile || userProfile.role !== "admin") {
    throw new Error("Only admins can update platform settings");
  }

  const { error } = await supabase
    .from("platform_settings")
    .update({
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (error) throw error;
}

/**
 * Get all platform settings
 */
export async function getAllPlatformSettings(
  supabaseClient?: SupabaseClient,
): Promise<Record<string, any>> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value");

  if (error) throw error;

  const settings: Record<string, any> = {};
  data?.forEach((setting) => {
    settings[setting.key] = setting.value;
  });

  return settings;
}
