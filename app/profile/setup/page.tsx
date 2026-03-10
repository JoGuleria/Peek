/**
 * Profile setup: after signup, user picks role, name, industry, skills, and uploads
 * a 15-second video intro. Form is client-side; data is saved to Supabase profiles.
 */

import { ProfileSetupForm } from "./ProfileSetupForm";

export default function ProfileSetupPage() {
  return (
    <main className="pt-14">
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-bold text-white">Set up your profile</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Tell others who you are. You can change this later.
        </p>
        <ProfileSetupForm />
      </div>
    </main>
  );
}
