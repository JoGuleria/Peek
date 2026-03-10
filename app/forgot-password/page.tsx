/**
 * Forgot password page: enter email to receive a password reset link.
 * Link goes to /auth/callback?type=recovery → then /reset-password to set new password.
 */

import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="pt-14">
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-white">Forgot password</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Enter your email and we’ll send you a link to reset your password.
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="text-cyan-400 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
