/**
 * Log in page: email + password form.
 * On success, redirect to /browse (or /profile/setup if no profile yet).
 */

import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="pt-14">
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-white">Log in</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Welcome back. Sign in to continue.
        </p>
        <LoginForm />
        <div className="mt-6 space-y-2 text-center">
          <p className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-cyan-400 underline hover:text-cyan-300"
            >
              Forgot password?
            </Link>
          </p>
          <p className="text-sm text-zinc-500">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-cyan-400 hover:underline">
            Sign up
          </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
