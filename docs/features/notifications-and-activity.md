# Notifications and Activity

Notifications and activity records keep users informed and give admins a trace of important platform events.

## Routes

- `/notifications`
- `/admin/audit`

## Main Data Records

- `notifications`
- `activity_logs`
- `audit_logs`
- `analytics_logs`

## Notifications

Notifications can be created by:

- Database triggers.
- Server actions.
- Admin decision RPCs.
- Payment or payout workflows.
- Volunteer review workflows.
- Community interactions.

Users can:

- Mark one notification as read.
- Mark all notifications as read.
- Delete a notification.

Actions live in `app/notifications/actions.ts`.

## Activity Logs

Activity logs track user-visible activity. They are useful for dashboards and history views.

## Audit Logs

Audit logs are more serious than normal activity logs. They should record operational decisions such as:

- Admin verification decisions.
- Refund decisions.
- Payout account decisions.
- Moderation decisions.
- CSR settlement decisions.
- Sensitive profile changes where required.

Admins inspect audit records in `/admin/audit`.

## Analytics Logs

Analytics logs are used for platform measurement and reporting. They should not become a dumping ground for sensitive private content.

