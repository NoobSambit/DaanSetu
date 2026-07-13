"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/lib/types/database.types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface NotificationListProps {
  initialNotifications: Notification[];
}

export default function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n,
          ),
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "campaign_milestone":
        return "🎯";
      case "volunteer_accepted":
        return "✅";
      case "badge_unlocked":
        return "🏆";
      case "post_liked":
        return "❤️";
      case "post_commented":
        return "💬";
      case "partnership_accepted":
        return "🤝";
      default:
        return "🔔";
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (notifications.length === 0) {
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No notifications
        </h3>
        <p className="text-gray-600">
          You&apos;re all caught up! Check back later for updates.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Action Bar */}
      {unreadCount > 0 && (
        <div className="mb-4 flex items-center justify-between bg-white rounded-lg shadow-sm px-6 py-3">
          <p className="text-sm text-gray-600">
            {unreadCount} unread{" "}
            {unreadCount === 1 ? "notification" : "notifications"}
          </p>
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {isMarkingAllRead ? "Marking..." : "Mark all as read"}
          </button>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map((notification) => {
          const content = (
            <div
              className={`px-6 py-4 ${
                notification.link ? "cursor-pointer hover:bg-gray-50" : ""
              } transition`}
              onClick={() => {
                if (!notification.is_read) {
                  handleMarkAsRead(notification.id);
                }
              }}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={`font-semibold ${!notification.is_read ? "text-gray-900" : "text-gray-700"}`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          { addSuffix: true },
                        )}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="ml-4 text-gray-400 hover:text-red-500 transition"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );

          return (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                !notification.is_read ? "border-l-4 border-blue-500" : ""
              }`}
            >
              {notification.link ? (
                <Link href={notification.link}>{content}</Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
