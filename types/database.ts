/**
 * Types for Peek's Supabase schema
 * Match these to your actual tables; regenerate from Supabase CLI if you use types gen.
 */

export type UserRole = "job_seeker" | "mentor" | "recruiter";

/** Valid options for "what I'm looking for" (multiple allowed) */
export type LookingForOption =
  | "mentorship"
  | "job opportunities"
  | "collaborations"
  | "networking"
  | "friendship";

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  industry: string;
  skills: string[];
  video_url: string | null;
  /** Short bio, max 150 characters */
  bio?: string | null;
  /** What I'm looking for (multiple selections) */
  looking_for?: LookingForOption[] | null;
  /** Interests outside of work (tags) */
  interests?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}
