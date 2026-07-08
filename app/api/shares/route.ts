import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST /api/shares - create a new share for a file
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { resource_type, resource_id } = body;

  // Validate input - only allow file sharing for now
  if (!resource_type || !resource_id) {
    return NextResponse.json(
      { error: "resource_type and resource_id are required" },
      { status: 400 }
    );
  }

  if (resource_type !== "file") {
    return NextResponse.json(
      { error: "Only file sharing is supported at this time" },
      { status: 400 }
    );
  }

  // Verify that the user owns the file
  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("id")
    .eq("id", resource_id)
    .eq("user_id", user.id)
    .single();

  if (fileError || !file) {
    return NextResponse.json(
      { error: "File not found or access denied" },
      { status: 404 }
    );
  }

  // Create the share
  const { data: share, error } = await supabase
    .from("shares")
    .insert({
      resource_type,
      resource_id,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: share }, { status: 201 });
}

// GET /api/shares - list all shares for the current user
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: shares, error } = await supabase
    .from("shares")
    .select(`
      id,
      token,
      resource_type,
      resource_id,
      created_at,
      expires_at,
      files(name, path)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: shares });
}