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

## Next steps

- **Auth**: Enable email confirmation in Supabase if you want verified emails.
- **Video upload**: Use Supabase Storage to upload 15s intros and save the public URL in `profiles.video_url`.
- **Connect**: In `BrowseFeed`, get the current user and insert a row into `connections` when they click Connect.
- **Profile page**: Add `/profile/[userId]` or `/profile/me` to view and edit the current user’s profile.
