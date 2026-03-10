import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcceptedConnectionsList } from "./AcceptedConnectionsList";

export default async function AcceptedConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: connections } = await supabase
    .from("connections")
    .select("id, from_user_id, to_user_id")
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .eq("status", "accepted");

  const otherUserIds = (connections ?? []).map((c) =>
    c.from_user_id === user.id ? c.to_user_id : c.from_user_id
  );

  const { data: profiles } =
    otherUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, user_id, role, display_name, industry, skills, video_url, updated_at")
          .in("user_id", otherUserIds)
      : { data: [] };

  return (
    <main className="pt-14">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Connections</h1>
        <p className="mt-1 text-sm text-zinc-400">
          People you’ve connected with. View their profiles to stay in touch.
        </p>
        <AcceptedConnectionsList profiles={profiles ?? []} />
      </div>
    </main>
  );
}
