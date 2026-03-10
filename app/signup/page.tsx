/**
 * Sign up page: email + password form.
 * After signup, user is redirected to profile setup to pick role and add details.
 */

import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export default function SignUpPage() {
  return (
    <main className="pt-14">
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-white">Create an account</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sign up to start connecting with job seekers, mentors, and
          recruiters.
        </p>
        <SignUpForm />
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
