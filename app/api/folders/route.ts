import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST /api/folders — create a new folder
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = body.name?.trim();
  const parent_id = body.parent_id ?? null;

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Folder name must be 1–100 characters" }, { status: 400 });
  }

  // Prevent duplicate folder names at same level
  const { data: existing } = await supabase
    .from("folders")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", name)
    .is("parent_id", parent_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: `A folder named "${name}" already exists here` }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({ name, parent_id, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/folders — rename, star, trash
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "Folder id required" }, { status: 400 });

  const allowedFields = ["name", "is_starred", "is_trashed", "color"];
  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in fields) update[field] = fields[field];
  }

  const { data, error } = await supabase
    .from("folders")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

// DELETE /api/folders?id=… — permanently remove a folder
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id =
    request.nextUrl.searchParams.get("id") ??
    (await request.json().catch(() => null))?.id;
  if (!id) return NextResponse.json({ error: "Folder id required" }, { status: 400 });

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: { deleted: true } });
}
