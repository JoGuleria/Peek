"use client";

/**
 * Browse feed: list of profile cards with video placeholder, name, role, industry,
 * skills, and a Connect button. Filters (role, industry, skills) can be added here
 * later with useState and filter of initialProfiles.
 */

import { useState, useMemo } from "react";
import { MirroredVideo } from "@/components/MirroredVideo";
import type { UserRole } from "@/types/database";

interface ProfileCard {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  industry: string;
  skills: string[];
  video_url: string | null;
  updated_at?: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  job_seeker: "Job seeker",
  mentor: "Mentor",
  recruiter: "Recruiter",
};

export function BrowseFeed({
  initialProfiles,
}: {
  initialProfiles: ProfileCard[];
}) {
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
            <ProfileCard key={profile.id} profile={profile} />
          ))
        )}
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: ProfileCard }) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    // TODO: insert into connections table with current user as from_user_id
    // For now we just simulate success
    await new Promise((r) => setTimeout(r, 500));
    setConnecting(false);
    setConnected(true);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
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
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-white">{profile.display_name}</h2>
            <p className="text-sm text-cyan-400">
              {ROLE_LABELS[profile.role]}
            </p>
            {profile.industry && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {profile.industry}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting || connected}
            className={
              "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors " +
              (connected
                ? "bg-zinc-700 text-zinc-400"
                : "bg-cyan-500 text-black hover:bg-cyan-400")
            }
          >
            {connecting
              ? "Connecting…"
              : connected
                ? "Connected"
                : "Connect"}
          </button>
        </div>
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
      </div>
    </article>
  );
}
