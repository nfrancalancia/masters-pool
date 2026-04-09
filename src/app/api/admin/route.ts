import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;
  const service = createServiceClient();

  if (action === "claim_commissioner") {
    // Only allow if no commissioner is set yet
    const { data: settings } = await service
      .from("pool_settings")
      .select("*")
      .limit(1)
      .single();

    if (settings?.commissioner_id) {
      return NextResponse.json({ error: "Commissioner already claimed" }, { status: 403 });
    }

    const { error: settingsError } = await service
      .from("pool_settings")
      .update({ commissioner_id: user.id })
      .eq("id", settings.id);

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    await service
      .from("profiles")
      .update({ is_commissioner: true })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  }

  if (action === "toggle_lock") {
    // Verify user is commissioner
    const { data: settings } = await service
      .from("pool_settings")
      .select("*")
      .limit(1)
      .single();

    if (settings?.commissioner_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await service
      .from("pool_settings")
      .update({ is_locked: !settings.is_locked })
      .eq("id", settings.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_locked: !settings.is_locked });
  }

  if (action === "update_deadline") {
    const { deadline } = body;

    const { data: settings } = await service
      .from("pool_settings")
      .select("*")
      .limit(1)
      .single();

    if (settings?.commissioner_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await service
      .from("pool_settings")
      .update({ entry_deadline: new Date(deadline).toISOString() })
      .eq("id", settings.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
