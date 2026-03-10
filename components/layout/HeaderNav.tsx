"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LinkButton } from "@/components/ui/LinkButton";

export function HeaderNav({ hasUser }: { hasUser: boolean }) {
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
      <LinkButton href="/signup">Sign up</LinkButton>
    </nav>
  );
}
