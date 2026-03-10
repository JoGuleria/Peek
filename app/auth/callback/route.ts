import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth callback. Supabase redirects here with ?token_hash=...&type=...
 * - type=email|signup: email confirmation → redirect to profile setup
 * - type=recovery: password reset link → redirect to /reset-password to set new password
 * Enable "Confirm email" and set Site URL / Redirect URLs in Supabase Auth.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/login?error=missing_params", request.url));
  }

  const redirectTo =
    type === "recovery"
      ? new URL("/reset-password", request.url)
      : new URL("/profile/setup", request.url);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    type: type as "email" | "signup" | "recovery",
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  return response;
}
