import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSetupForm } from "./setup/ProfileSetupForm";

type PageProps = {
  searchParams: Promise<{ saved?: string }> | { saved?: string };
};

export default async function ProfilePage({ searchParams }: PageProps) {
  const params = typeof searchParams.then === "function" ? await searchParams : searchParams;
  const initialSaved = params.saved === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, industry, skills, video_url, bio, looking_for, interests")
    .eq("user_id", user.id)
    .single();

  return (
    <main className="pt-14">
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-bold text-white">My profile</h1>
        <p className="mt-1 text-sm text-zinc-400">
          View and edit your intro. Changes are saved to your profile.
        </p>
        <ProfileSetupForm
          initialProfile={profile ?? undefined}
          redirectAfterSave="/profile"
          initialSaved={initialSaved}
        />
      </div>
    </main>
  );
}
