import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";

async function getOwnedFile(fileId: string, userId: string) {
  const supabase = createServerSupabaseClient();

  const { data: file, error } = await supabase
    .from("files")
    .select("id, name, path, user_id, is_trashed")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single();

  return { file, error };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", _request.url));
  }

  const { file, error } = await getOwnedFile(params.id, user.id);
  if (error || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error: signedUrlError } = await admin.storage
    .from("user-files")
    .createSignedUrl(file.path, 60, { download: file.name });

  if (signedUrlError || !data?.signedUrl) {
    return NextResponse.json(
      { error: signedUrlError?.message ?? "Failed to prepare download" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}

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
  const allowedFields = ["name", "is_starred", "is_trashed", "folder_id"];
  const update: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in body) {
      update[field] = field === "name" ? String(body[field]).trim() : body[field];
    }
  }

  if (typeof update.name === "string" && !update.name) {
    return NextResponse.json({ error: "File name cannot be empty" }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("files")
    .update(update)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

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

  const { file, error: fileError } = await getOwnedFile(params.id, user.id);
  if (fileError || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { error: storageError } = await admin.storage
    .from("user-files")
    .remove([file.path]);

  if (storageError) {
    return NextResponse.json(
      { error: `Storage delete failed: ${storageError.message}` },
      { status: 502 }
    );
  }

  const { error } = await supabase
    .from("files")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: { deleted: true } });
}
