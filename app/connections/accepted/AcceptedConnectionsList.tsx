"use client";

import Link from "next/link";
import { MirroredVideo } from "@/components/MirroredVideo";
import type { UserRole } from "@/types/database";

const ROLE_LABELS: Record<UserRole, string> = {
  job_seeker: "Job seeker",
  mentor: "Mentor",
  recruiter: "Recruiter",
};

type Profile = {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  industry: string;
  skills: string[];
  video_url: string | null;
  updated_at?: string;
};

export function AcceptedConnectionsList({ profiles }: { profiles: Profile[] }) {
  if (profiles.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
        <p>No connections yet.</p>
        <p className="mt-1 text-sm">Accept requests on the Requests page to grow your network.</p>
        <Link
          href="/connections"
          className="mt-4 inline-block text-sm text-cyan-400 hover:underline"
        >
          View requests
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-4">
      {profiles.map((profile) => (
        <li key={profile.id}>
          <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <Link href={`/profile/${profile.user_id}`} className="block">
              <div className="video-container w-full">
                {profile.video_url ? (
                  <MirroredVideo
                    src={
                      profile.updated_at
                        ? `${profile.video_url}?t=${new Date(profile.updated_at).getTime()}`
                        : profile.video_url
                    }
                    preload="metadata"
                  />
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center text-zinc-600">
                    No video yet
                  </div>
                )}
              </div>
            </Link>
            <div className="p-4">
              <Link
                href={`/profile/${profile.user_id}`}
                className="font-semibold text-white hover:underline"
              >
                {profile.display_name}
              </Link>
              <p className="text-sm text-cyan-400">{ROLE_LABELS[profile.role]}</p>
              {profile.industry && (
                <p className="mt-0.5 text-sm text-zinc-500">{profile.industry}</p>
              )}
              {profile.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/profile/${profile.user_id}`}
                className="mt-3 inline-block text-sm text-cyan-400 hover:underline"
              >
                View profile →
              </Link>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
