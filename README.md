# Peek

Video-first professional networking: job seekers, mentors, and recruiters connect through 15-second video intros.

## Stack

- **Next.js** (App Router), **TypeScript**, **Tailwind CSS**
- **Supabase** for auth and database

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migration:  
   Copy the contents of `supabase/migrations/001_initial_schema.sql` and execute it.
3. In **Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure (beginner-friendly)

| Path | Purpose |
|------|--------|
| `app/` | App Router pages and layouts |
| `app/page.tsx` | Landing page |
| `app/login/` | Log in page and form |
| `app/signup/` | Sign up page and form |
| `app/profile/setup/` | Profile setup (role, name, industry, skills, video URL) |
| `app/browse/` | Browse feed with filters and Connect button |
| `lib/supabase/` | Supabase client (browser + server + middleware) |
| `components/` | Reusable UI (Header, LinkButton) |
| `types/database.ts` | Shared types for profiles and connections |
| `supabase/migrations/` | SQL schema (profiles, connections, RLS) |

## Email confirmation (optional)

To require users to confirm their email before signing in:

1. In Supabase: **Authentication** → **Providers** → **Email** → turn on **Confirm email**.
2. In **Authentication** → **URL Configuration**:
   - **Site URL**: your app URL (e.g. `https://yoursite.vercel.app` or `http://localhost:3000`).
   - **Redirect URLs**: add `https://yoursite.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` for local dev).
3. (Optional) In **Authentication** → **Email Templates** → **Confirm signup**, you can set the confirmation link to use your callback, e.g. `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`. If the default template already redirects to your Site URL with token params, the app’s `/auth/callback` route will handle it.

After confirming, users are sent to `/profile/setup`.

## Next steps

- **Video upload**: Use Supabase Storage to upload 15s intros and save the public URL in `profiles.video_url`.
- **Connect**: In `BrowseFeed`, get the current user and insert a row into `connections` when they click Connect.
- **Profile page**: Add `/profile/[userId]` or `/profile/me` to view and edit the current user’s profile.
