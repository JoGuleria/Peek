"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MirroredVideo } from "@/components/MirroredVideo";
import type { UserRole } from "@/types/database";

const ROLE_LABELS: Record<UserRole, string> = {
  job_seeker: "Job seeker",
  mentor: "Mentor",
  recruiter: "Recruiter",
};

const LOOKING_FOR_LABELS: Record<string, string> = {
  mentorship: "Mentorship",
  "job opportunities": "Job opportunities",
  collaborations: "Collaborations",
  networking: "Networking",
  friendship: "Friendship",
};

type Profile = {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  industry: string;
  skills: string[];
  video_url: string | null;
  bio?: string | null;
  looking_for?: string[] | null;
  interests?: string[] | null;
  updated_at?: string;
};

export function PublicProfileView({
  profile,
  currentUserId,
  initialPending,
}: {
  profile: Profile;
  currentUserId: string | null;
  initialPending: boolean;
}) {
  const [connecting, setConnecting] = useState(false);
  const [pending, setPending] = useState(initialPending);
  const [connectError, setConnectError] = useState<string | null>(null);

  async function handleConnect() {
    if (!currentUserId) {
      window.location.href = "/login";
      return;
    }
    if (profile.user_id === currentUserId) return;
    setConnectError(null);
    setConnecting(true);
    const supabase = createClient();
    const { error } = await supabase.from("connections").insert({
      from_user_id: currentUserId,
      to_user_id: profile.user_id,
      status: "pending",
    });
    setConnecting(false);
    if (!error || error.code === "23505") {
      setPending(true);
      if (!error) {
        fetch("/api/notify-connection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toUserId: profile.user_id }),
        }).catch(() => {});
      }
    } else {
      setConnectError(error.message || "Couldn’t send request. Try again.");
    }
  }

  const isOwnProfile = currentUserId === profile.user_id;
  const showPending = pending || initialPending;
  const videoUrl = profile.video_url
    ? profile.updated_at
      ? `${profile.video_url}?t=${new Date(profile.updated_at).getTime()}`
      : profile.video_url
    : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      <div className="video-container w-full">
        {videoUrl ? (
          <MirroredVideo src={videoUrl} preload="metadata" />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center text-zinc-600">
            No video yet
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">
              {profile.display_name}
            </h1>
            <p className="mt-1 text-cyan-400">{ROLE_LABELS[profile.role]}</p>
            {profile.industry && (
              <p className="mt-0.5 text-sm text-zinc-500">{profile.industry}</p>
            )}
            {profile.bio && (
              <p className="mt-2 text-sm text-zinc-400">{profile.bio}</p>
            )}
          </div>
          <div className="shrink-0">
            {!currentUserId ? (
              <Link
                href="/login"
                className="inline-flex rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400"
              >
                Log in to connect
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isOwnProfile || showPending || connecting}
                className={
                  "rounded-xl px-4 py-2 text-sm font-medium transition-colors " +
                  (isOwnProfile || showPending
                    ? "bg-zinc-700 text-zinc-400"
                    : "bg-cyan-500 text-black hover:bg-cyan-400")
                }
              >
                {isOwnProfile
                  ? "You"
                  : connecting
                    ? "Connecting…"
                    : showPending
                      ? "Pending"
                      : "Connect"}
              </button>
            )}
          </div>
        </div>
        {connectError && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {connectError}
          </p>
        )}
        {profile.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="sr-only">Skills:</span>
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
        {profile.looking_for && profile.looking_for.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Looking for
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.looking_for.map((v) => (
                <span
                  key={v}
                  className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300"
                >
                  {LOOKING_FOR_LABELS[v] ?? v}
                </span>
              ))}
            </div>
          </div>
        )}
        {profile.interests && profile.interests.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
