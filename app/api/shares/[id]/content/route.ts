import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

function hashPassword(plain: string) {
  return createHash("sha256").update(plain).digest("hex");
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * GET /api/shares/[id]/content
 * Public endpoint to list files and subfolders inside a shared folder.
 * Query params:
 *   - folderId  (optional) — navigate into a subfolder; validated via is_subfolder_of()
 * Headers:
 *   - x-share-password (optional) — plain-text password to verify
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = createAdminClient();

  // 1. Resolve share
  const { data: share, error: shareError } = await admin
    .from("shares")
    .select("id, folder_id, password, expires_at")
    .eq("id", params.id)
    .single();

  if (shareError || !share || !share.folder_id) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  if (isExpired(share.expires_at)) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // 2. Verify password if required
  if (share.password) {
    const provided = request.headers.get("x-share-password") ?? "";
    if (!provided || hashPassword(provided) !== share.password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    }
  }

  // 3. Determine which folder to list
  const requestedFolderId =
    request.nextUrl.searchParams.get("folderId") ?? share.folder_id;

  // 4. Security: make sure requested folder is the root or a descendant of it
  if (requestedFolderId !== share.folder_id) {
    const { data: isChild, error: rpcError } = await admin.rpc("is_subfolder_of", {
      target_id: requestedFolderId,
      root_id: share.folder_id,
    });

    if (rpcError || !isChild) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  // 5. Fetch contents
  const [{ data: files }, { data: folders }] = await Promise.all([
    admin
      .from("files")
      .select("id, name, size, type, created_at, updated_at")
      .eq("folder_id", requestedFolderId)
      .eq("is_trashed", false)
      .order("name"),
    admin
      .from("folders")
      .select("id, name, created_at, updated_at")
      .eq("parent_id", requestedFolderId)
      .eq("is_trashed", false)
      .order("name"),
  ]);

  return NextResponse.json({
    data: {
      share_id: params.id,
      root_folder_id: share.folder_id,
      current_folder_id: requestedFolderId,
      files: files ?? [],
      folders: folders ?? [],
    },
  });
}
