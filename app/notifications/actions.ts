"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

async function notificationOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    throw new Error("A verified account is required");
  }
  return { supabase, user };
}

export async function markNotificationReadAction(notificationId: string) {
  const id = z.string().uuid().parse(notificationId);
  const { supabase, user } = await notificationOwner();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error("Notification could not be updated");
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const { supabase, user } = await notificationOwner();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  if (error) throw new Error("Notifications could not be updated");
  revalidatePath("/notifications");
}

export async function deleteNotificationAction(notificationId: string) {
  const id = z.string().uuid().parse(notificationId);
  const { supabase, user } = await notificationOwner();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error("Notification could not be removed");
  revalidatePath("/notifications");
}
