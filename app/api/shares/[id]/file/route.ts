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
 * GET /api/shares/[id]/file
 * Public file access for share links.
 * Query params:
 *   - fileId   (required for folder shares) — the file to serve
 *   - download (optional, "true")            — force Content-Disposition: attachment
 * Headers:
 *   - x-share-password (optional) — plain-text password
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = createAdminClient();

  // 1. Resolve the share row (admin bypasses RLS for public access)
  const { data: share, error: shareError } = await admin
    .from("shares")
    .select("id, file_id, folder_id, password, expires_at")
    .eq("id", params.id)
    .single();

  if (shareError || !share) {
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

  // 3. Determine target file
  let targetFileId: string | null = share.file_id;

  if (!targetFileId) {
    // Folder share — the caller must specify which file they want
    targetFileId = request.nextUrl.searchParams.get("fileId");
    if (!targetFileId) {
      return NextResponse.json({ error: "fileId is required for folder shares" }, { status: 400 });
    }

    // Security: verify the file belongs to the shared folder (or a subfolder of it)
    const { data: file } = await admin
      .from("files")
      .select("id, folder_id, path, name, type")
      .eq("id", targetFileId)
      .single();

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check that the file is inside the shared folder tree
    if (file.folder_id && share.folder_id) {
      const { data: isChild } = await admin.rpc("is_subfolder_of", {
        target_id: file.folder_id,
        root_id: share.folder_id,
      });

      if (!isChild) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (file.folder_id !== share.folder_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 4. Create signed URL and redirect
    const download = request.nextUrl.searchParams.get("download") === "true";
    const { data, error: urlError } = await admin.storage
      .from("user-files")
      .createSignedUrl(file.path, 120, download ? { download: file.name } : undefined);

    if (urlError || !data?.signedUrl) {
      return NextResponse.json({ error: "Failed to prepare file" }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  }

  // Direct file share — fetch the file record
  const { data: file } = await admin
    .from("files")
    .select("id, path, name, type")
    .eq("id", targetFileId)
    .single();

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("download") === "true";
  const { data, error: urlError } = await admin.storage
    .from("user-files")
    .createSignedUrl(file.path, 120, download ? { download: file.name } : undefined);

  if (urlError || !data?.signedUrl) {
    return NextResponse.json({ error: "Failed to prepare file" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
