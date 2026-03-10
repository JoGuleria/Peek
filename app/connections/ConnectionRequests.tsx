"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/database";

const ROLE_LABELS: Record<UserRole, string> = {
  job_seeker: "Job seeker",
  mentor: "Mentor",
  recruiter: "Recruiter",
};

type RequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  from_profile: {
    user_id: string;
    display_name: string;
    role: UserRole;
    industry: string;
    video_url: string | null;
  } | null;
};

export function ConnectionRequests({
  requests,
  currentUserId,
}: {
  requests: RequestRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleAccept(connectionId: string) {
    setUpdatingId(connectionId);
    const supabase = createClient();
    await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connectionId)
      .eq("to_user_id", currentUserId);
    setUpdatingId(null);
    router.refresh();
  }

  async function handleDecline(connectionId: string) {
    setUpdatingId(connectionId);
    const supabase = createClient();
    await supabase
      .from("connections")
      .update({ status: "declined" })
      .eq("id", connectionId)
      .eq("to_user_id", currentUserId);
    setUpdatingId(null);
    router.refresh();
  }

  if (requests.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
        <p>No pending requests.</p>
        <p className="mt-2 text-xs text-zinc-500">
          When someone sends you a request from Browse or your profile, it will show up here.
        </p>
        <Link
          href="/browse"
          className="mt-4 inline-block text-sm text-cyan-400 hover:underline"
        >
          Browse profiles
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-4">
      {requests.map((req) => (
        <li
          key={req.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
        >
          <div className="min-w-0">
            <Link
              href={`/profile/${req.from_user_id}`}
              className="font-medium text-white hover:underline"
            >
              {req.from_profile?.display_name ?? "Someone"}
            </Link>
            {req.from_profile && (
              <p className="text-sm text-zinc-500">
                {ROLE_LABELS[req.from_profile.role]}
                {req.from_profile.industry && ` · ${req.from_profile.industry}`}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => handleAccept(req.id)}
              disabled={updatingId === req.id}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
            >
              {updatingId === req.id ? "…" : "Accept"}
            </button>
            <button
              type="button"
              onClick={() => handleDecline(req.id)}
              disabled={updatingId === req.id}
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
