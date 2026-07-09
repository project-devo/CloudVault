import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

// POST /api/shares — create or replace a share for a file or folder
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { file_id, folder_id, expires_at, password } = body;

  if (!file_id && !folder_id) {
    return NextResponse.json(
      { error: "Either file_id or folder_id is required" },
      { status: 400 }
    );
  }
  if (file_id && folder_id) {
    return NextResponse.json(
      { error: "Provide either file_id or folder_id, not both" },
      { status: 400 }
    );
  }

  // Verify ownership
  if (file_id) {
    const { data: file } = await supabase
      .from("files")
      .select("id")
      .eq("id", file_id)
      .eq("user_id", user.id)
      .single();
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } else {
    const { data: folder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folder_id)
      .eq("user_id", user.id)
      .single();
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
  }

  // Delete any existing share for this resource first (upsert replacement)
  if (file_id) {
    await supabase.from("shares").delete().eq("file_id", file_id).eq("user_id", user.id);
  } else {
    await supabase.from("shares").delete().eq("folder_id", folder_id).eq("user_id", user.id);
  }

  // Create the share
  const payload: Record<string, unknown> = {
    user_id: user.id,
    file_id: file_id ?? null,
    folder_id: folder_id ?? null,
    password: password ? hashPassword(String(password)) : null,
    expires_at: expires_at ?? null,
  };

  const { data: share, error } = await supabase
    .from("shares")
    .insert(payload)
    .select("id, file_id, folder_id, expires_at, created_at")
    .single();

  if (error || !share) {
    return NextResponse.json({ error: error?.message ?? "Failed to create share" }, { status: 500 });
  }

  return NextResponse.json(
    {
      data: {
        id: share.id,
        file_id: share.file_id,
        folder_id: share.folder_id,
        has_password: Boolean(password),
        expires_at: share.expires_at,
        created_at: share.created_at,
      },
    },
    { status: 201 }
  );
}

// GET /api/shares — list all shares for the current user
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const transformed = (shares ?? []).map((share: any) => ({
    id: share.id,
    file_id: share.file_id,
    folder_id: share.folder_id,
    has_password: Boolean(share.password),
    expires_at: share.expires_at,
    created_at: share.created_at,
    updated_at: share.updated_at,
    file: share.file ?? null,
    folder: share.folder ?? null,
  }));

  return NextResponse.json({ data: transformed });
}