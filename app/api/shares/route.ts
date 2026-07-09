import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST /api/shares - create a new share for a file or folder
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { resource_type, resource_id, expires_at, password } = body;

  // Validate input
  if (!resource_type || !resource_id) {
    return NextResponse.json(
      { error: "resource_type and resource_id are required" },
      { status: 400 }
    );
  }

  if (!["file", "folder"].includes(resource_type)) {
    return NextResponse.json(
      { error: "resource_type must be either 'file' or 'folder'" },
      { status: 400 }
    );
  }

  // Optional: parse expires_at if provided
  let expiresAt = null;
  if (expires_at) {
    const parsed = new Date(expires_at);
    if (!isNaN(parsed.getTime())) {
      expiresAt = parsed.toISOString();
    }
  }

  // Optional: hash password if provided
  let passwordHash = null;
  if (password && password.trim() !== "") {
    const crypto = require("crypto");
    passwordHash = crypto.createHash("sha256").update(password.trim()).digest("hex");
  }

  // Verify that the user owns the resource
  let isOwner = false;
  if (resource_type === "file") {
    const { data: resource, error: resourceError } = await supabase
      .from("files")
      .select("id")
      .eq("id", resource_id)
      .eq("user_id", user.id)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }
    isOwner = true;
  } else if (resource_type === "folder") {
    const { data: resource, error: resourceError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", resource_id)
      .eq("user_id", user.id)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "Folder not found or access denied" },
        { status: 404 }
      );
    }
    isOwner = true;
  }

  // Prepare insert data for legacy schema
  const insertData = {
    user_id: user.id,
    file_id: resource_type === "file" ? resource_id : null,
    folder_id: resource_type === "folder" ? resource_id : null,
    password: passwordHash,
    expires_at: expiresAt,
  };

  // Create the share
  const { data: share, error } = await supabase
    .from("shares")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Construct share URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${appUrl}/share/${share.id}`;

  return NextResponse.json(
    {
      data: {
        ...share,
        share_url: shareUrl,
      }
    },
    { status: 201 }
  );
}

// GET /api/shares - list shares for the current user with optional filtering
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resourceType = searchParams.get("resource_type");
  const resourceId = searchParams.get("resource_id");

  let query = supabase
    .from("shares")
    .select(`
      id,
      user_id,
      file_id,
      folder_id,
      password,
      expires_at,
      created_at,
      updated_at,
      files(id, name, type, size, path),
      folders(id, name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (resourceType) {
    // Note: the legacy schema does not have resource_type, so we need to map
    // resource_type to file_id/folder_id presence.
    // We'll handle this by doing a manual filter after fetching, or we can adjust the query.
    // For simplicity, we'll fetch all and then filter in memory.
    // Since the dataset is likely small, we'll do that.
  }
  if (resourceId) {
    // Similarly, we need to match file_id or folder_id.
  }

  let { data: shares, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sharesList = shares || [];

  // Apply filtering based on resourceType and resourceId in memory
  if (resourceType || resourceId) {
    sharesList = sharesList.filter((share: any) => {
      const matchType = !resourceType || 
        (resourceType === "file" && share.file_id !== null) ||
        (resourceType === "folder" && share.folder_id !== null);
      const matchId = !resourceId ||
        (share.file_id !== null && share.file_id === resourceId) ||
        (share.folder_id !== null && share.folder_id !== null && share.folder_id === resourceId);
      return matchType && matchId;
    });
  }

  // Transform each share to the format expected by the frontend
  const transformed = sharesList.map((share: any) => ({
    id: share.id,
    file_id: share.file_id,
    folder_id: share.folder_id,
    has_password: !!share.password,
    expires_at: share.expires_at,
    created_at: share.created_at,
    updated_at: share.updated_at,
    file: share.files
      ? {
          id: share.files.id,
          name: share.files.name,
          type: share.files.type,
          size: share.files.size,
          path: share.files.path,
        }
      : null,
    folder: share.folders
      ? {
          id: share.folders.id,
          name: share.folders.name,
        }
      : null,
  }));

  return NextResponse.json({ data: transformed });
}