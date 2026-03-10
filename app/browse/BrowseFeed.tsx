"use client";

/**
 * Browse feed: profile cards with video, filters, and Connect button.
 * Connect inserts into connections table; if a request already exists, shows "Pending".
 */

import Link from "next/link";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { MirroredVideo } from "@/components/MirroredVideo";
import type { UserRole } from "@/types/database";

const LOOKING_FOR_LABELS: Record<string, string> = {
  mentorship: "Mentorship",
  "job opportunities": "Job opportunities",
  collaborations: "Collaborations",
  networking: "Networking",
  friendship: "Friendship",
};

const BIO_TRUNCATE_LENGTH = 80;

interface ProfileCard {
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
}

const ROLE_LABELS: Record<UserRole, string> = {
  job_seeker: "Job seeker",
  mentor: "Mentor",
  recruiter: "Recruiter",
};

export function BrowseFeed({
  initialProfiles,
  currentUserId,
  initialPendingToUserIds = [],
}: {
  initialProfiles: ProfileCard[];
  currentUserId: string | null;
  initialPendingToUserIds?: string[];
}) {
  const pendingSet = useMemo(
    () => new Set(initialPendingToUserIds),
    [initialPendingToUserIds]
  );
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [industryFilter, setIndustryFilter] = useState("");
  const [skillsFilter, setSkillsFilter] = useState("");

  const filtered = useMemo(() => {
    let list = [...initialProfiles];
    if (roleFilter !== "all") {
      list = list.filter((p) => p.role === roleFilter);
    }
    if (industryFilter.trim()) {
      const term = industryFilter.trim().toLowerCase();
      list = list.filter((p) =>
        p.industry.toLowerCase().includes(term)
      );
    }
    if (skillsFilter.trim()) {
      const terms = skillsFilter
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      list = list.filter((p) =>
        terms.some((t) =>
          p.skills.some((s) => s.toLowerCase().includes(t))
        )
      );
    }
    return list;
  }, [initialProfiles, roleFilter, industryFilter, skillsFilter]);

  return (
    <div className="mt-6 space-y-6">
      {/* Simple filters */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Filters
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500">Role</label>
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as UserRole | "all")
              }
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="job_seeker">Job seeker</option>
              <option value="mentor">Mentor</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500">Industry</label>
            <input
              type="text"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              placeholder="e.g. Tech"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skillsFilter}
              onChange={(e) => setSkillsFilter(e.target.value)}
              placeholder="e.g. React, Leadership"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Profile cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-zinc-500">
            No profiles match your filters. Try adjusting them or come back later.
          </p>
        ) : (
          filtered.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              currentUserId={currentUserId}
              initialPending={pendingSet.has(profile.user_id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  currentUserId,
  initialPending,
}: {
  profile: ProfileCard;
  currentUserId: string | null;
  initialPending: boolean;
}) {
  const [connecting, setConnecting] = useState(false);
  const [pending, setPending] = useState(initialPending);
  const [connectError, setConnectError] = useState<string | null>(null);

  async function handleConnect() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (profile.user_id === user.id) return; // don't connect to self
    setConnectError(null);
    setConnecting(true);
    const { error } = await supabase.from("connections").insert({
      from_user_id: user.id,
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
  const buttonDisabled = isOwnProfile || showPending || connecting;
  const buttonLabel = isOwnProfile
    ? "You"
    : connecting
      ? "Connecting…"
      : showPending
        ? "Pending"
        : "Connect";

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      <Link href={`/profile/${profile.user_id}`} className="block">
        {/* Video area: placeholder or actual video */}
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
          <div className="flex h-full items-center justify-center text-zinc-600">
            No video yet
          </div>
        )}
      </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/profile/${profile.user_id}`}
              className="font-semibold text-white hover:underline"
            >
              {profile.display_name}
            </Link>
            <p className="text-sm text-cyan-400">
              {ROLE_LABELS[profile.role]}
            </p>
            {profile.industry && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {profile.industry}
              </p>
            )}
            {profile.bio && (
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {profile.bio.length > BIO_TRUNCATE_LENGTH
                  ? `${profile.bio.slice(0, BIO_TRUNCATE_LENGTH)}…`
                  : profile.bio}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleConnect}
            disabled={buttonDisabled}
            className={
              "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors " +
              (showPending || isOwnProfile
                ? "bg-zinc-700 text-zinc-400"
                : "bg-cyan-500 text-black hover:bg-cyan-400")
            }
          >
            {buttonLabel}
          </button>
        </div>
        {connectError && (
          <p className="mt-2 text-xs text-red-400" role="alert">
            {connectError}
          </p>
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
        {(profile.looking_for?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.looking_for!.slice(0, 3).map((v) => (
              <span
                key={v}
                className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs text-cyan-300"
              >
                {LOOKING_FOR_LABELS[v] ?? v}
              </span>
            ))}
            {(profile.looking_for?.length ?? 0) > 3 && (
              <span className="text-xs text-zinc-500">
                +{profile.looking_for!.length - 3}
              </span>
            )}
          </div>
        )}
        {(profile.interests?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.interests!.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400"
              >
                {tag}
              </span>
            ))}
            {(profile.interests?.length ?? 0) > 4 && (
              <span className="text-xs text-zinc-500">
                +{profile.interests!.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
