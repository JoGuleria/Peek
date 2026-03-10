# Peek — Detailed Project Summary

## Overview

**Peek** is a video-first professional networking web application. Users sign up, choose a role (job seeker, mentor, or recruiter), create a profile with a 15-second video intro plus optional short bio, “what I’m looking for” (mentorship, job opportunities, collaborations, networking, friendship), and interests outside work, browse other profiles, and send connection requests. Recipients can accept or decline requests. New connection requests trigger an email notification via Resend. Email confirmation at signup is supported via Supabase and a custom auth callback.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Auth** | Supabase Auth (email/password) |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage (video intros) |
| **Email** | Resend (connection notifications) |
| **Session** | Supabase SSR (`@supabase/ssr`) with cookies; refresh via Next.js proxy |
| **Deployment** | Vercel |

**Key dependencies:** `next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr`, `resend`, `tailwindcss`.

---

## User Roles

- **Job seeker** — Looking for opportunities and mentorship
- **Mentor** — Offering guidance and expanding network
- **Recruiter** — Sourcing talent

One role per user; stored in `profiles.role`.

---

## Features (Detailed)

### 1. Landing Page (`/`)

- Hero headline and short value proposition
- “Choose your role” section: three cards (Job seeker, Mentor, Recruiter)
- CTAs: “Create your profile” (→ `/signup`) and “Browse intros” (→ `/browse`)
- Footer line

### 2. Authentication

**Sign up (`/signup`)**

- Form: email, password (min 6 characters)
- On submit: `supabase.auth.signUp()` with `emailRedirectTo: origin + '/auth/callback'`
- If Supabase “Confirm email” is enabled: after signup the user sees “Check your email” and must click the link in the email; the link goes to `/auth/callback`, which verifies the OTP and redirects to `/profile/setup`
- If confirmation is disabled: user is signed in immediately and redirected to `/profile/setup`
- Link to Log in at bottom

**Log in (`/login`)**

- Form: email, password
- On submit: `supabase.auth.signInWithPassword()`; on success → `/browse`
- “Forgot password?” link → `/forgot-password`; Link to Sign up at bottom

**Forgot password (`/forgot-password`)**

- Form: email only
- On submit: `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth/callback' })`
- Success: “Check your email” message; user clicks link in email → `/auth/callback?type=recovery&token_hash=...` → callback verifies OTP and redirects to `/reset-password`

**Reset password (`/reset-password`)**

- Shown after user clicks the reset link in email (session established by callback)
- Requires auth; if no session (e.g. direct visit), redirect to `/login?error=session_expired`
- Form: new password, confirm password (min 6 chars); on submit: `supabase.auth.updateUser({ password })`; on success → `/browse`
- Link “Back to log in” at bottom

**Auth callback (`/auth/callback`)**

- GET route handler for email confirmation and password reset
- Expects query params: `token_hash`, `type` (`email`, `signup`, or `recovery`)
- Uses `supabase.auth.verifyOtp({ type, token_hash })` to establish session and set cookies
- On success: if `type === 'recovery'` → redirect to `/reset-password`; else → redirect to `/profile/setup`
- On missing params or error → redirect to `/login?error=...`
- Requires Supabase redirect URL to include `/auth/callback`

### 3. Profile Setup (`/profile/setup`)

- First-time onboarding after signup
- Requires authentication; redirects to `/login` if not logged in
- Form fields:
  - **Role** — Job seeker / Mentor / Recruiter (pills)
  - **Display name** (required)
  - **Industry** (text)
  - **Short bio** — Text, max 150 characters (with character counter)
  - **What I’m looking for** — Multi-select: mentorship, job opportunities, collaborations, networking, friendship (stored as text[])
  - **Interests outside of work** — Comma-separated tags (stored as text[], like skills)
  - **Skills** (comma-separated tags)
  - **Video intro** — In-browser recording via `VideoRecorder` (camera + mic, max 15s), upload to Supabase Storage `intros/{user_id}/intro.webm`, public URL saved to profile
- Submit: upsert into `profiles` (on conflict `user_id`); redirect to `/browse`
- Video: live preview mirrored; after recording, playback uses `MirroredVideo` (mirrored image + custom controls); “Delete and re-record” clears Storage and resets state

### 4. My Profile (`/profile`)

- View and edit own profile; requires auth
- Server loads profile by `user_id`; passes `initialProfile` to same form component as setup
- Same fields as setup; video section shows current video (if any) plus “Delete and re-record” / “Record a new video”
- Submit: upsert profile; redirect to `/profile` with refresh
- Button label: “Save changes” when editing, “Save profile” when new
- **Delete account:** Section below the form with “Delete account” button. On click, a confirmation modal asks: “Are you sure? This will permanently delete your profile and video.” On confirm, client calls `DELETE /api/delete-account`; API (using service role) deletes the user’s video from Storage (`intros/{user_id}/intro.webm`), profile row, all connections involving the user, then `auth.admin.deleteUser(userId)`. Client signs out and redirects to `/`.

### 5. Browse Feed (`/browse`)

- Server: fetches all profiles (id, user_id, role, display_name, industry, skills, video_url, bio, looking_for, interests, updated_at), ordered by created_at; fetches current user and their outgoing connection requests (to_user_id list)
- Client: `BrowseFeed` receives `initialProfiles`, `currentUserId`, `initialPendingToUserIds`
- Filters (client-side): role dropdown, industry text, skills comma-separated; filters the initial list
- Each card: video (or “No video yet”), name (link to `/profile/[user_id]`), role, industry, short bio (truncated to 80 chars if longer), skills tags, “looking for” tags (up to 3 shown), interests tags (up to 4 shown), **Connect** button
- **Connect:** If not logged in → redirect to `/login`. If own profile → “You” (disabled). If already sent request → “Pending” (disabled). Else: insert into `connections` (from_user_id, to_user_id, status `pending`); on success call `POST /api/notify-connection` with `{ toUserId }` (fire-and-forget); set local state to Pending. Duplicate insert (unique violation) also shows Pending. If insert fails (e.g. RLS), an error message is shown under the button.
- Video and name link to public profile

### 6. Public Profile (`/profile/[id]`)

- **Route param:** `[id]` is the profile’s **user_id** (not the profile row id)
- Server: fetches profile by `user_id`; if not found → `notFound()`. Fetches current user and checks if they already have a connection to this profile (initialPending)
- Viewable without logging in
- Renders: video intro (MirroredVideo, cache-busted with updated_at), display name, role, industry, short bio (if set), skills, “Looking for” tags (mentorship, job opportunities, etc.), “Interests” tags
- **Connect:** Not logged in → “Log in to connect” (link to `/login`). Logged in + own profile → “You” (disabled). Already sent → “Pending” (disabled). Else → Connect button; on click same insert + notify as browse. On insert failure, an error message is shown.
- 404: custom `not-found.tsx` in segment: “Profile not found” + link to Browse

### 7. Connection Requests (`/connections`)

- Lists **pending** connection requests where the current user is the **recipient** (to_user_id)
- Requires auth; redirects to `/login` if not logged in
- Page uses `export const dynamic = 'force-dynamic'` so the list is never cached and new requests appear when the recipient visits
- Server: fetches connections (to_user_id = me, status = pending); fetches sender profiles by from_user_id; merges for display
- Client: list of cards with sender name (link to their public profile), role, industry; **Accept** and **Decline** buttons
- **Accept:** Update connection to `status: 'accepted'`; refresh list
- **Decline:** Update connection to `status: 'declined'`; refresh list
- Copy explains that when someone clicks Connect on the user’s profile or in Browse, they appear here
- Empty state: “No pending requests” + short note that requests will show up when sent; link to Browse
- Linked from header as “Requests”

### 8. Accepted Connections (`/connections/accepted`)

- Lists people the current user has **accepted** connections with (or who accepted the current user’s request). Fetches all connections where the current user is either `from_user_id` or `to_user_id` and `status = 'accepted'`.
- Requires auth; redirects to `/login` if not logged in.
- Server: fetches accepted connections for the current user; for each row, computes the “other” user id (the connection partner). Fetches those users’ profiles (name, role, industry, skills, video_url, updated_at).
- Client: `AcceptedConnectionsList` displays each connection as a card similar to the browse feed: video (MirroredVideo, cache-busted), display name (link to public profile), role, industry, skills tags, and a “View profile →” link to `/profile/[user_id]`. No Connect button.
- Empty state: “No connections yet” + link to “View requests” (`/connections`).
- Linked from header as “Connections” (when logged in).

### 9. Header

- **Logged in:** Peek (logo → `/`), Browse, **Requests** (`/connections`), **Connections** (`/connections/accepted`), Profile (`/profile`), Log out (client-side signOut + redirect to `/`)
- **Requests badge:** When logged in, the server fetches the count of pending connection requests where the current user is the recipient (`to_user_id`, `status = 'pending'`) using the Supabase server client. This count is passed to `HeaderNav` as `pendingRequestsCount`. If count > 0, a small red circular badge appears next to “Requests” showing the number (or “99+” if over 99). If count is 0, no badge is shown.
- **Logged out:** Peek, Browse, Log in, Sign up
- Header is an async server component that gets the current user, fetches the pending-requests count when user exists, and passes `hasUser` and `pendingRequestsCount` to client `HeaderNav`

### 10. Connection Notification Email

- **API route:** `POST /api/notify-connection`
- **Body:** `{ toUserId: string }`
- Uses **Supabase service_role** client to call `auth.admin.getUserById(toUserId)` and get recipient email
- Sends email via **Resend:** from “Peek &lt;onboarding@resend.dev&gt;”, to recipient email, subject “Someone wants to connect with you on Peek!”, body “Someone wants to connect with you on Peek! Log in to see who.”
- Called from Connect flow (browse card and public profile) only after a **successful** new insert into `connections`
- Requires env: `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`

### 11. Delete Account

- **API route:** `DELETE /api/delete-account` (no body; uses session cookie to identify user)
- Requires authenticated user (server reads session via Supabase server client). Returns 401 if not logged in
- Uses **Supabase service_role** client to perform, in order: (1) remove Storage object `intros/{user_id}/intro.webm` (ignore if missing), (2) delete all rows from `public.connections` where `from_user_id` or `to_user_id` equals the user, (3) delete the user’s row from `public.profiles`, (4) call `auth.admin.deleteUser(userId)`
- On success returns `{ ok: true }`; on error returns `{ error: message }` with 500
- **UI:** On My Profile (`/profile`), below the form, a “Delete account” button opens a confirmation modal: “Are you sure? This will permanently delete your profile and video.” Confirm calls the API; on success the client signs out and redirects to `/`
- Requires env: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` (same as notify-connection)

---

## Database Schema (Supabase)

### Table: `public.profiles`

| Column        | Type         | Description                    |
|---------------|--------------|--------------------------------|
| id            | uuid, PK     | Profile row id                 |
| user_id       | uuid, FK→auth.users, unique | One profile per user |
| role          | text         | job_seeker \| mentor \| recruiter |
| display_name  | text         | Required                       |
| industry      | text         | Default ''                     |
| skills        | text[]       | Default '{}'                   |
| video_url     | text, nullable | Public URL of intro video   |
| bio           | text, nullable | Short bio, max 150 chars (check constraint) |
| looking_for   | text[]       | Default '{}'; allowed: mentorship, job opportunities, collaborations, networking, friendship |
| interests     | text[]       | Default '{}'; interests outside work (comma-separated in UI) |
| created_at    | timestamptz  |                                |
| updated_at    | timestamptz  |                                |

**RLS:** Authenticated can INSERT/UPDATE own row; SELECT allowed for `authenticated` and `anon` (so browse and public profile work without login).

### Table: `public.connections`

| Column        | Type         | Description                    |
|---------------|--------------|--------------------------------|
| id            | uuid, PK     |                                |
| from_user_id  | uuid, FK→auth.users | Sender of request        |
| to_user_id    | uuid, FK→auth.users | Recipient               |
| status        | text         | pending \| accepted \| declined |
| created_at    | timestamptz  |                                |
| updated_at    | timestamptz  |                                |

**Constraints:** Unique (from_user_id, to_user_id); check from_user_id ≠ to_user_id.

**RLS:** Users can SELECT connections they’re part of; INSERT only as from_user_id; UPDATE only as to_user_id (for accept/decline).

### Storage: bucket `intros`

- **Public** bucket for video playback
- Path: `{user_id}/intro.webm`
- **RLS:** Authenticated can INSERT/UPDATE/DELETE only in own folder (`(storage.foldername(name))[1] = auth.uid()::text`); public SELECT

**Migrations:** `supabase/migrations/` (e.g. `000_setup_tables_once.sql`, `002_storage_intros.sql`, `003_profiles_anon_read.sql`, `004_profiles_bio_looking_for_interests.sql` — adds bio, looking_for, interests with ADD COLUMN IF NOT EXISTS).

---

## Video Recording and Playback

- **Recording:** Browser `getUserMedia` + `MediaRecorder` (e.g. video/webm). Live preview mirrored (CSS scaleX(-1)). Max 15 seconds; then upload to Storage; preview URL cache-busted with `?t=Date.now()` after re-record so new video shows immediately.
- **Playback:** `MirroredVideo` component: video element with scaleX(-1), **custom controls** (play/pause, progress bar, time) so controls are not flipped. Used on profile setup “done” state, my profile, browse cards, and public profile.
- **VideoRecorder** accepts optional `currentVideoUrl`; when set, shows that video plus “Delete and re-record” and “Record a new video” when idle.

---

## Environment Variables

| Variable | Purpose | Where used |
|----------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin (get user email, delete user) | `/api/notify-connection`, `/api/delete-account` |
| `RESEND_API_KEY` | Resend send email | `/api/notify-connection` |

Never expose the service_role key in the browser. Documented in `.env.local.example`; `.env*` in `.gitignore`.

---

## Project Structure (Files)

```
peek/
├── app/
│   ├── api/
│   │   ├── delete-account/
│   │   │   └── route.ts          # DELETE: remove user video, profile, connections, auth user (service role)
│   │   └── notify-connection/
│   │       └── route.ts          # POST: send connection email via Resend
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # GET: email confirmation OTP verify, redirect /profile/setup
│   ├── browse/
│   │   ├── page.tsx              # Server: fetch profiles + current user’s pending to_user_ids
│   │   └── BrowseFeed.tsx        # Client: filters, cards, Connect
│   ├── connections/
│   │   ├── page.tsx              # Server: fetch pending requests + sender profiles
│   │   ├── ConnectionRequests.tsx # Client: list Accept/Decline
│   │   └── accepted/
│   │       ├── page.tsx          # Server: fetch accepted connections + other users’ profiles
│   │       └── AcceptedConnectionsList.tsx # Client: cards (video, name, role, skills, link to profile)
│   ├── login/
│   │   ├── page.tsx
│   │   └── LoginForm.tsx
│   ├── forgot-password/
│   │   ├── page.tsx
│   │   └── ForgotPasswordForm.tsx
│   ├── reset-password/
│   │   ├── page.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── profile/
│   │   ├── page.tsx              # My profile (server: fetch own profile)
│   │   ├── setup/
│   │   │   ├── page.tsx
│   │   │   └── ProfileSetupForm.tsx
│   │   └── [id]/
│   │       ├── page.tsx          # Public profile by user_id
│   │       ├── PublicProfileView.tsx
│   │       └── not-found.tsx
│   ├── signup/
│   │   ├── page.tsx
│   │   └── SignUpForm.tsx
│   ├── layout.tsx
│   ├── page.tsx                  # Landing
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # Async server: gets user, fetches pending requests count
│   │   └── HeaderNav.tsx         # Client: links (Browse, Requests, Connections, Profile), Requests badge, Log out
│   ├── ui/
│   │   └── LinkButton.tsx
│   ├── VideoRecorder.tsx
│   └── MirroredVideo.tsx
├── lib/
│   └── supabase/
│       ├── client.ts             # Browser client
│       ├── server.ts             # Server client (cookies)
│       └── middleware.ts         # updateSession for proxy
├── types/
│   └── database.ts               # UserRole, LookingForOption, Profile, Connection
├── supabase/
│   └── migrations/               # SQL schema, RLS, storage
├── proxy.ts                      # Next 16: session refresh (not middleware.ts)
├── next.config.ts
├── tsconfig.json
├── package.json
├── .env.local.example
├── README.md
└── PROJECT_SUMMARY.md            # This file
```

---

## Deployment (Vercel)

- Connect GitHub repo; build command and output directory are Next.js defaults
- **Environment variables:** Set all four (Supabase URL, anon key, service role key, Resend API key) for Production (and Preview if desired)
- **Redeploy** after changing env vars
- **Deployment Protection:** Disable for Production if the site should be public without Vercel login
- **Supabase Redirect URLs:** Add `https://<vercel-domain>/auth/callback` (and localhost for dev) when using email confirmation

---

## Email Confirmation (Supabase)

- **Auth → Providers → Email:** Enable “Confirm email”
- **Auth → URL Configuration:** Set Site URL; add Redirect URLs including `.../auth/callback`
- Optional: **Auth → Email Templates → Confirm signup** — set link to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` if default does not already send users to that path
- After signup, user sees “Check your email”; clicking the link hits `/auth/callback`, which verifies OTP and redirects to `/profile/setup`

---

## What Is Not Implemented

- **Custom “from” domain in Resend** — App uses `onboarding@resend.dev`; add and verify your domain in Resend to use a custom from address
- **Block or report** — No blocking or reporting flows

## Password Reset (Supabase)

- In **Supabase Dashboard → Authentication → URL Configuration**, ensure Redirect URLs include `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback` for dev). Same as email confirmation.
- Optional: **Auth → Email Templates → Reset password** — set the link to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery` if you want to control the URL; Supabase default may already use Site URL with these params.

---

## Quick Reference: User Flows

1. **Sign up → Confirm email (if on) → Profile setup → Browse → Connect** → Recipient gets email; recipient goes to Requests → Accept/Decline. After accepting, both users see each other on **Connections** (`/connections/accepted`).
2. **Public profile:** Anyone can open `/profile/{user_id}`; logged-in users can Connect; not logged-in see “Log in to connect.”
3. **My profile:** Logged-in user can view/edit at `/profile`; update video or fields and Save changes. From the same page they can **Delete account** (confirmation modal → API deletes video, profile, connections, auth user → redirect to `/`).
4. **Connections:** Logged-in user can open **Connections** in the header to see accepted connections as cards (video, name, role, industry, skills) with links to each person’s public profile.

This document reflects the state of the Peek project as of the last update.
