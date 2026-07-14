# Volunteer Operations Workflow

This workflow covers volunteers and NGO volunteer managers.

## Volunteer Profile

1. User opens `/volunteer/profile`.
2. User saves city, skills, availability, and related details.
3. Record is stored in `volunteer_profiles`.

## Opportunity Creation

1. NGO opens `/ngo/dashboard/volunteers`.
2. NGO creates an opportunity.
3. Server validates title, required skills, city, date, capacity, and status.
4. Record is stored in `volunteer_opportunities`.

## Discovery and Application

1. Volunteer opens `/volunteer/opportunities`.
2. Volunteer filters opportunities.
3. Volunteer applies.
4. Server inserts a `volunteer_applications` row.
5. NGO can see the application.

## Application Review

1. NGO opens `/ngo/dashboard/volunteers`.
2. NGO reviews applications.
3. Server action calls `review_volunteer_application`.
4. Database updates status.
5. Volunteer receives a notification.

## Hour Submission

1. Volunteer completes work.
2. Volunteer opens `/volunteer/dashboard`.
3. Volunteer submits hours.
4. Record is stored in `volunteer_hours`.

## Hour Review

1. NGO reviews submitted hours.
2. Server action calls `review_volunteer_hours`.
3. Approved hours can create skill verification and certificate records.
4. Volunteer receives a notification.

## Certificate Download

1. Volunteer opens dashboard.
2. User clicks certificate download.
3. `/api/volunteer-certificates/[id]` checks ownership.
4. Route returns a PDF.

## Rules

- Users can manage their own volunteer profile.
- Volunteers can withdraw their own applications.
- NGO owners can review only opportunities they own.
- Certificates should only be available to authorized participants.

