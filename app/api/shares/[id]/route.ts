import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET /api/shares/:id — public: resolve a share link (no auth required)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;

  const { data: share, error } = await supabase
    .from("shares")
    .select(
      `
      id,
      file_id,
      folder_id,
      password,
      expires_at,
      created_at,
      updated_at,
      file:files(id, name, type, size),
      folder:folders(id, name)
    `
    )
    .eq("id", id)
    .single() as any;

  if (error || !share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
  }

  return NextResponse.json({
    data: {
      id: share.id,
      file_id: share.file_id,
      folder_id: share.folder_id,
      has_password: Boolean(share.password),
      expires_at: share.expires_at,
      created_at: share.created_at,
      updated_at: share.updated_at,
      file: share.file ?? null,
      folder: share.folder ?? null,
    },
  });
}

// DELETE /api/shares/:id — revoke a share (must be the owner)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("shares")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/shares/:id — update settings (expiry / password)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if ("expires_at" in body) updates.expires_at = body.expires_at;
  if ("password" in body) {
    const crypto = await import("crypto");
    updates.password = body.password
      ? crypto.createHash("sha256").update(String(body.password).trim()).digest("hex")
      : null;
  }

  const { error } = await supabase
    .from("shares")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}