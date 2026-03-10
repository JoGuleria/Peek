"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LinkButton } from "@/components/ui/LinkButton";

export function HeaderNav({
  hasUser,
  pendingRequestsCount = 0,
}: {
  hasUser: boolean;
  pendingRequestsCount?: number;
}) {
  const router = useRouter();

  async function handleLogOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (hasUser) {
    return (
      <nav className="flex items-center gap-3">
        <Link
          href="/browse"
          className="text-sm text-zinc-400 hover:text-white"
        >
          Browse
        </Link>
        <Link
          href="/connections"
          className="relative inline-flex items-center text-sm text-zinc-400 hover:text-white"
        >
          Requests
          {pendingRequestsCount > 0 && (
            <span
              className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white"
              aria-label={`${pendingRequestsCount} pending requests`}
            >
              {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
            </span>
          )}
        </Link>
        <Link
          href="/connections/accepted"
          className="text-sm text-zinc-400 hover:text-white"
        >
          Connections
        </Link>
        <Link
          href="/profile"
          className="text-sm text-zinc-400 hover:text-white"
        >
          Profile
        </Link>
        <button
          type="button"
          onClick={handleLogOut}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Log out
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3">
      <Link
        href="/browse"
        className="text-sm text-zinc-400 hover:text-white"
      >
        Browse
      </Link>
      <Link
        href="/login"
        className="text-sm text-zinc-400 hover:text-white"
      >
        Log in
      </Link>
      <Link
        href="/forgot-password"
        className="text-sm text-cyan-400 hover:text-cyan-300"
      >
        Forgot password?
      </Link>
      <LinkButton href="/signup">Sign up</LinkButton>
    </nav>
  );
}
