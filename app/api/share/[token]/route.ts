import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/share/[token] - resolve a share token and redirect to the file
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createAdminClient(); // use service role to bypass RLS
  const token = params.token;

  // Find the share by token
  const { data: share, error: shareError } = await supabase
    .from("shares")
    .select("*, files!inner(id, name, path)")
    .eq("token", token)
    .single();

  if (shareError || !share) {
    return NextResponse.json({ error: "Invalid or expired share link" }, { status: 404 });
  }

  // Check if the share has expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
  }

  // Only support file sharing for now
  if (share.resource_type !== "file") {
    return NextResponse.json(
      { error: "Folder sharing is not supported yet" },
      { status: 501 }
    );
  }

  const file = share.files;
  if (!file) {
    return NextResponse.json({ error: "Associated file not found" }, { status: 404 });
  }

  // Create a signed URL for the file (valid for 5 minutes)
  const admin = createAdminClient();
  const { data: signedUrlData, error: signedUrlError } = await admin.storage
    .from("user-files")
    .createSignedUrl(file.path, 300);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }

  // Redirect to the signed URL
  // Check if download is requested
  const download = request.nextUrl.searchParams.get("download") === "true";
  const redirectUrl = new URL(signedUrlData.signedUrl);
  if (download) {
    redirectUrl.searchParams.set("download", "true");
  }

  return NextResponse.redirect(redirectUrl);
}