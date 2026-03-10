import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <main className="pt-14">
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-white">Profile not found</h1>
        <p className="mt-2 text-zinc-400">
          This profile doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/browse"
          className="mt-6 inline-block rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400"
        >
          Browse profiles
        </Link>
      </div>
    </main>
  );
}
