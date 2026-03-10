import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/notify-connection
 * Body: { toUserId: string }
 * Sends an email to the user with id toUserId: "Someone wants to connect with you on Peek! Log in to see who."
 * Requires RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY in env.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const toUserId = body?.toUserId;
    if (!toUserId || typeof toUserId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid toUserId" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server missing Supabase config" },
        { status: 500 }
      );
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Server missing RESEND_API_KEY" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.admin.getUserById(toUserId);
    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Recipient user not found or has no email" },
        { status: 404 }
      );
    }

    const { error: sendError } = await resend.emails.send({
      from: "Peek <onboarding@resend.dev>",
      to: user.email,
      subject: "Someone wants to connect with you on Peek!",
      text: "Someone wants to connect with you on Peek! Log in to see who.",
    });

    if (sendError) {
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
