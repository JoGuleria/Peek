import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * DELETE /api/delete-account
 *
 * Deletes the authenticated user's data:
 * - Video from Storage: intros/{user_id}/intro.webm
 * - Profile row from public.profiles
 * - Connections where from_user_id or to_user_id = user_id
 * - Auth user from auth.users (via service role)
 *
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (server-only)
 */
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server missing Supabase config" },
        { status: 500 }
      );
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const userId = user.id;

    // Delete video intro from Storage (ignore errors if file is missing)
    await adminClient.storage
      .from("intros")
      .remove([`${userId}/intro.webm`])
      .catch(() => {});

    // Delete connections where the user is either sender or recipient
    const { error: connectionsError } = await adminClient
      .from("connections")
      .delete()
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
    if (connectionsError) {
      return NextResponse.json(
        { error: connectionsError.message },
        { status: 500 }
      );
    }

    // Delete profile row
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("user_id", userId);
    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // Finally, delete auth user
    const { error: deleteUserError } =
      await adminClient.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      return NextResponse.json(
        { error: deleteUserError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

