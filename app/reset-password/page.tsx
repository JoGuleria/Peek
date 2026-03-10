/**
 * Reset password page: set new password after clicking the link in the reset email.
 * User lands here from /auth/callback after verifying the recovery OTP (session is set).
 * If no session, redirect to login.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=session_expired");
  }

  return (
    <main className="pt-14">
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-white">Set new password</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Enter your new password below.
        </p>
        <ResetPasswordForm />
        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="text-cyan-400 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
