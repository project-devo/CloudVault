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
 * POST /api/shares/[id]/folder
 * Get contents of a folder within a shared folder.
 * Body: { folderId: string }
 * Headers: x-share-password (optional)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = createAdminClient();
  const { id: shareId } = params;

  // 1. Get the share
  const { data: share, error: shareError } = await admin
    .from("shares")
    .select("id, folder_id, password, expires_at")
    .eq("id", shareId)
    .single();

  if (shareError || !share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  if (isExpired(share.expires_at)) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // 2. Verify password if set
  if (share.password) {
    const provided = request.headers.get("x-share-password") ?? "";
    if (!provided || hashPassword(provided) !== share.password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    }
  }

  // 3. Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { folderId } = body;
  if (!folderId) {
    return NextResponse.json({ error: "folderId is required" }, { status: 400 });
  }

  // 4. Verify that the folderId is within the shared folder tree
  // If the share is for a folder, then the accessible root is share.folder_id.
  // We need to ensure that folderId is either the root itself or a subfolder of it.
  // We'll fetch the folder to get its parent_id and then check if it's inside the share's folder.
  const { data: targetFolder, error: folderError } = await admin
    .from("folders")
    .select("id, parent_id")
    .eq("id", folderId)
    .single();

  if (folderError || !targetFolder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  // Check if the target folder is inside the shared folder
  let isAllowed = false;
  if (share.folder_id) {
    // Share is for a specific folder
    if (targetFolder.id === share.folder_id) {
      isAllowed = true; // root folder
    } else if (targetFolder.parent_id) {
      // We need to check if the target folder is a descendant of share.folder_id
      // We can do this by traversing up the parent chain or using a recursive CTE.
      // For simplicity, we'll assume the folder hierarchy is not too deep and we can loop.
      let current = targetFolder.parent_id;
      while (current) {
        if (current === share.folder_id) {
          isAllowed = true;
          break;
        }
        const { data: parent } = await admin
          .from("folders")
          .select("id, parent_id")
          .eq("id", current)
          .single();
        if (!parent?.id) break;
        current = parent.parent_id;
      }
    }
  } else {
    // This should not happen because the share is for a folder, so share.folder_id should be set.
    // But if it's not, we treat as no access.
    isAllowed = false;
  }

  if (!isAllowed) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // 5. Fetch the contents of the folder (files and subfolders)
  const { data: files, error: filesError } = await admin
    .from("files")
    .select("id, name, type, size, created_at")
    .eq("folder_id", folderId)
    .order("created_at", { ascending: false });

  if (filesError) {
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }

  const { data: folders, error: foldersError } = await admin
    .from("folders")
    .select("id, name, created_at")
    .eq("parent_id", folderId)
    .order("created_at", { ascending: false });

  if (foldersError) {
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }

  // 6. Return the result
  return NextResponse.json({
    data: {
      folderId,
      files: files.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        created_at: f.created_at,
      })),
      folders: folders.map((f: any) => ({
        id: f.id,
        name: f.name,
        created_at: f.created_at,
      })),
    }
  });
}