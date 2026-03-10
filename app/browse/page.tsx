/**
 * Browse feed: scroll through user profiles (video intros).
 * Filter by role, industry, and skills. Each card has a Connect button.
 * Data is loaded server-side from Supabase; filters can be client-side or URL params.
 */

import { createClient } from "@/lib/supabase/server";
import { BrowseFeed } from "./BrowseFeed";

export default async function BrowsePage() {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, user_id, role, display_name, industry, skills, video_url, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    // RLS or network error: show empty feed. Run migration 003 if browse fails when not logged in.
    console.error("Browse profiles error:", error);
  }

  return (
    <main className="pt-14">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Browse</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Scroll through intros. Use filters to narrow by role, industry, or
          skills.
        </p>
        <BrowseFeed initialProfiles={profiles ?? []} />
      </div>
    </main>
  );
}
