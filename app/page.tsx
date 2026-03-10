/**
 * Landing page: hero + value prop + CTA to sign up or browse.
 */

import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";

export default function HomePage() {
  return (
    <main className="pt-14">
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Networking, one video at a time
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          Peek is where job seekers, mentors, and recruiters connect through
          15-second video intros. No walls of text — just real people.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <LinkButton href="/signup">Create your profile</LinkButton>
          <LinkButton href="/browse" variant="secondary">
            Browse intros
          </LinkButton>
        </div>
      </section>

      {/* Role pills: who the app is for */}
      <section className="border-t border-zinc-800 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-sm font-medium uppercase tracking-wider text-zinc-500">
            Choose your role
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <RoleCard
              title="Job seeker"
              description="Show who you are in 15 seconds. Get discovered by recruiters and mentors."
            />
            <RoleCard
              title="Mentor"
              description="Share your experience. Help others grow and expand your network."
            />
            <RoleCard
              title="Recruiter"
              description="Find talent with personality. Watch intros and reach out when it clicks."
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
        <p>Peek — video-first professional networking.</p>
      </footer>
    </main>
  );
}

function RoleCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
    </div>
  );
}
