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
import type { UserRole, LookingForOption } from "@/types/database";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "job_seeker", label: "Job seeker" },
  { value: "mentor", label: "Mentor" },
  { value: "recruiter", label: "Recruiter" },
];

const LOOKING_FOR_OPTIONS: { value: LookingForOption; label: string }[] = [
  { value: "mentorship", label: "Mentorship" },
  { value: "job opportunities", label: "Job opportunities" },
  { value: "collaborations", label: "Collaborations" },
  { value: "networking", label: "Networking" },
  { value: "friendship", label: "Friendship" },
];

const BIO_MAX_LENGTH = 150;

type InitialProfile = {
  role: UserRole;
  display_name: string;
  industry: string;
  skills: string[];
  video_url: string | null;
  bio?: string | null;
  looking_for?: string[] | null;
  interests?: string[] | null;
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
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [lookingFor, setLookingFor] = useState<LookingForOption[]>(
    (initialProfile?.looking_for as LookingForOption[] | undefined) ?? []
  );
  const [interestsInput, setInterestsInput] = useState(
    initialProfile?.interests?.length ? initialProfile.interests.join(", ") : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      setBio(initialProfile.bio ?? "");
      setLookingFor((initialProfile.looking_for as LookingForOption[] | undefined) ?? []);
      setInterestsInput(initialProfile.interests?.length ? initialProfile.interests.join(", ") : "");
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

    const bioTrimmed = bio.trim();
    if (bioTrimmed.length > BIO_MAX_LENGTH) {
      setError(`Bio must be at most ${BIO_MAX_LENGTH} characters.`);
      setLoading(false);
      return;
    }

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const interests = interestsInput
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
          bio: bioTrimmed || null,
          looking_for: lookingFor.length ? lookingFor : null,
          interests: interests.length ? interests : null,
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

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setDeleteError(
          data?.error || "Something went wrong deleting your account."
        );
        setDeleting(false);
        return;
      }

      // Best-effort sign out on the client; the user is already deleted server-side.
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      setDeleteError(
        e instanceof Error
          ? e.message
          : "Something went wrong deleting your account."
      );
      setDeleting(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="mt-8 text-center text-zinc-500">Checking login…</div>
    );
  }

  return (
    <>
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
          htmlFor="bio"
          className="block text-sm font-medium text-zinc-300"
        >
          Short bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
          maxLength={BIO_MAX_LENGTH}
          rows={2}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder="A brief intro (max 150 characters)"
        />
        <p className="mt-0.5 text-xs text-zinc-500">
          {bio.length}/{BIO_MAX_LENGTH}
        </p>
      </div>

      <div>
        <span className="block text-sm font-medium text-zinc-300">
          What I&apos;m looking for
        </span>
        <p className="mt-0.5 text-xs text-zinc-500">
          Select all that apply
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LOOKING_FOR_OPTIONS.map((opt) => {
            const checked = lookingFor.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={
                  "flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors " +
                  (checked
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700")
                }
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setLookingFor((prev) =>
                      prev.includes(opt.value)
                        ? prev.filter((x) => x !== opt.value)
                        : [...prev, opt.value]
                    );
                  }}
                  className="sr-only"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="interests"
          className="block text-sm font-medium text-zinc-300"
        >
          Interests outside of work
        </label>
        <input
          id="interests"
          type="text"
          value={interestsInput}
          onChange={(e) => setInterestsInput(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder="e.g. Hiking, Music, Cooking"
        />
        <p className="mt-0.5 text-xs text-zinc-500">
          Comma-separated
        </p>
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
      <div className="mt-8 border-t border-zinc-800 pt-6">
        {deleteError && (
          <div
            className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
            role="alert"
          >
            {deleteError}
          </div>
        )}
        <p className="text-sm text-zinc-400">
          Want to leave Peek? You can permanently delete your account and intro.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="mt-3 w-full rounded-xl border border-red-500/60 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10"
        >
          Delete account
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Delete account</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Are you sure? This will permanently delete your profile and video.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!deleting) {
                    setShowDeleteConfirm(false);
                  }
                }}
                className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-red-400 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
