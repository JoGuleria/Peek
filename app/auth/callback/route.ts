import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Email confirmation callback. Supabase redirects here with ?token_hash=...&type=email
 * (or type=signup). We verify the OTP, set the session cookies, and redirect to profile setup.
 * Enable "Confirm email" in Supabase Auth → Providers → Email and set Site URL / Redirect URLs.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/login?error=missing_params", request.url));
  }

  const response = NextResponse.redirect(new URL("/profile/setup", request.url));

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
    type: type as "email" | "signup",
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  return response;
}
