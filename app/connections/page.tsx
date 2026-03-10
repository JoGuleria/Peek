import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConnectionRequests } from "./ConnectionRequests";

// Always fetch fresh data so recipients see new requests
export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requests } = await supabase
    .from("connections")
    .select("id, from_user_id, to_user_id, status, created_at")
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const fromUserIds = (requests ?? []).map((r) => r.from_user_id);
  const { data: profiles } =
    fromUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, role, industry, video_url")
          .in("user_id", fromUserIds)
      : { data: [] };

  const profileByUserId = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  const requestsWithProfiles = (requests ?? []).map((r) => ({
    ...r,
    from_profile: profileByUserId.get(r.from_user_id) ?? null,
  }));

  return (
    <main className="pt-14">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Connection requests</h1>
        <p className="mt-1 text-sm text-zinc-400">
          When someone clicks Connect on your profile or in Browse, they appear here. Accept or decline below.
        </p>
        <ConnectionRequests
          requests={requestsWithProfiles}
          currentUserId={user.id}
        />
      </div>
    </main>
  );
}
