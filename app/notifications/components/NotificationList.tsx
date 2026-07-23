"use client";

import Link from "next/link";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/notifications/actions";
import Toast from "@/components/Toast";
import { EmptyState } from "@/components/ui/PagePrimitives";
import type { Notification } from "@/lib/types/database.types";

interface NotificationListProps {
  initialNotifications: Notification[];
}

function notificationIcon(type: string) {
  return (
    {
      campaign_milestone: "🎯",
      volunteer_accepted: "✅",
      badge_unlocked: "🏆",
      post_liked: "❤️",
      post_commented: "💬",
      partnership_accepted: "🤝",
    }[type] ?? "🔔"
  );
}

export default function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleMarkAsRead(notificationId: string) {
    try {
      setBusyId(notificationId);
      await markNotificationReadAction(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setFeedback({
        type: "error",
        message: "The notification could not be marked as read.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllAsRead() {
    setIsMarkingAllRead(true);
    try {
      await markAllNotificationsReadAction();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: true })),
      );
      setFeedback({
        type: "success",
        message: "All notifications marked as read.",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      setFeedback({
        type: "error",
        message: "Notifications could not be marked as read.",
      });
    } finally {
      setIsMarkingAllRead(false);
    }
  }

  async function handleDelete(notificationId: string) {
    try {
      setBusyId(notificationId);
      await deleteNotificationAction(notificationId);
      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId),
      );
      setFeedback({ type: "success", message: "Notification removed." });
    } catch (error) {
      console.error("Error deleting notification:", error);
      setFeedback({
        type: "error",
        message: "The notification could not be removed.",
      });
    } finally {
      setBusyId(null);
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <>
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="You are all caught up"
          description="New campaign activity, partnership updates, and community milestones will appear here."
        />
      ) : (
        <div>
          {unreadCount > 0 && (
            <div className="panel mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm font-medium text-slate-600">
                {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
              </p>
              <button
                className="btn btn-secondary min-h-9 px-3 py-1.5 text-xs"
                disabled={isMarkingAllRead}
                onClick={handleMarkAllAsRead}
                type="button"
              >
                <CheckCheck aria-hidden="true" className="h-4 w-4" />
                {isMarkingAllRead ? "Marking…" : "Mark all as read"}
              </button>
            </div>
          )}

          <div className="space-y-3" aria-label="Notifications">
            {notifications.map((notification) => {
              const body = (
                <div
                  className={`min-w-0 px-4 py-4 sm:px-5 ${notification.link ? "cursor-pointer transition-colors hover:bg-slate-50" : ""}`}
                >
                  <div className="flex gap-3">
                    <span aria-hidden="true" className="mt-0.5 text-xl">
                      {notificationIcon(notification.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-bold ${notification.is_read ? "text-slate-700" : "text-slate-950"}`}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          { addSuffix: true },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );

              return (
                <article
                  className={`panel overflow-hidden ${notification.is_read ? "" : "border-l-4 border-l-blue-500"}`}
                  key={notification.id}
                >
                  <div className="flex items-stretch">
                    <div
                      className="min-w-0 flex-1"
                      onClick={() =>
                        !notification.is_read &&
                        void handleMarkAsRead(notification.id)
                      }
                    >
                      {notification.link ? (
                        <Link href={notification.link}>{body}</Link>
                      ) : (
                        body
                      )}
                    </div>
                    <button
                      aria-label={`Delete notification: ${notification.title}`}
                      className="m-3 self-start rounded-md p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700"
                      disabled={busyId === notification.id}
                      onClick={() => void handleDelete(notification.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
      {feedback && (
        <Toast
          isVisible
          message={feedback.message}
          onClose={() => setFeedback(null)}
          type={feedback.type}
        />
      )}
    </>
  );
}
