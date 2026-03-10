"use client";

/**
 * Profile setup form: role, display name, industry, skills (tags), and video URL.
 * In production you’d upload the video to Supabase Storage and save the public URL here.
 * For now we use a URL field as a placeholder.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VideoRecorder } from "@/components/VideoRecorder";
import type { UserRole } from "@/types/database";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "job_seeker", label: "Job seeker" },
  { value: "mentor", label: "Mentor" },
  { value: "recruiter", label: "Recruiter" },
];

type InitialProfile = {
  role: UserRole;
  display_name: string;
  industry: string;
  skills: string[];
  video_url: string | null;
};

export function ProfileSetupForm({
  initialProfile,
  redirectAfterSave = "/browse",
}: {
  initialProfile?: InitialProfile | null;
  redirectAfterSave?: string;
} = {}) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(initialProfile?.role ?? "job_seeker");
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "");
  const [industry, setIndustry] = useState(initialProfile?.industry ?? "");
  const [skillsInput, setSkillsInput] = useState(
    initialProfile?.skills?.length ? initialProfile.skills.join(", ") : ""
  );
  const [videoUrl, setVideoUrl] = useState(initialProfile?.video_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    if (initialProfile) {
      setRole(initialProfile.role);
      setDisplayName(initialProfile.display_name);
      setIndustry(initialProfile.industry);
      setSkillsInput(initialProfile.skills?.length ? initialProfile.skills.join(", ") : "");
      setVideoUrl(initialProfile.video_url ?? "");
    }
  }, [initialProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    // Skills: split by comma and trim
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          role,
          display_name: displayName,
          industry: industry.trim(),
          skills,
          video_url: videoUrl.trim() || null,
        },
        { onConflict: "user_id" }
      );

    setLoading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    router.push(redirectAfterSave);
    router.refresh();
  }

  if (!authChecked) {
    return (
      <div className="mt-8 text-center text-zinc-500">Checking login…</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-300">Role</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={
                "rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                (role === r.value
                  ? "bg-cyan-500 text-black"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-zinc-300"
        >
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder="How you want to be called"
        />
      </div>

      <div>
        <label
          htmlFor="industry"
          className="block text-sm font-medium text-zinc-300"
        >
          Industry
        </label>
        <input
          id="industry"
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder="e.g. Tech, Healthcare, Design"
        />
      </div>

      <div>
        <label
          htmlFor="skills"
          className="block text-sm font-medium text-zinc-300"
        >
          Skills (comma-separated)
        </label>
        <input
          id="skills"
          type="text"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder="e.g. React, Product, Leadership"
        />
      </div>

      <div>
        <label
          htmlFor="videoUrl"
          className="block text-sm font-medium text-zinc-300"
        >
          Video intro
        </label>
        <p className="mt-0.5 text-xs text-zinc-500">
          Record a short intro (up to 15 sec). It uploads automatically. We’ll
        </p>
        {userId && (
          <VideoRecorder
            userId={userId}
            onUploadComplete={(url) => setVideoUrl(url)}
            currentVideoUrl={videoUrl || undefined}
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-cyan-500 py-2.5 font-semibold text-black transition-colors hover:bg-cyan-400 disabled:opacity-50"
      >
        {loading ? "Saving…" : initialProfile ? "Save changes" : "Save profile"}
      </button>
    </form>
  );
}
