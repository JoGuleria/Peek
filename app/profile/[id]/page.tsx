import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicProfileView } from "./PublicProfileView";

type PageProps = { params: Promise<{ id: string }> };

export default async function PublicProfilePage({ params }: PageProps) {
  const { id: userId } = await params; // id in URL is the profile's user_id
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, user_id, role, display_name, industry, skills, video_url, bio, looking_for, interests, updated_at")
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    notFound();
  }

  let currentUserId: string | null = null;
  let initialPending = false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    currentUserId = user.id;
    const { data: existing } = await supabase
      .from("connections")
      .select("id")
      .eq("from_user_id", user.id)
      .eq("to_user_id", profile.user_id)
      .maybeSingle();
    initialPending = !!existing;
  }

  return (
    <main className="pt-14">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <PublicProfileView
          profile={profile}
          currentUserId={currentUserId}
          initialPending={initialPending}
        />
      </div>
    </main>
  );
}
