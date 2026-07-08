import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// DELETE /api/shares/[id] - delete a share by ID
export async function DELETE(
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

  const shareId = params.id;

  // Verify that the share belongs to the user
  const { data: share, error: shareError } = await supabase
    .from("shares")
    .select("id, user_id")
    .eq("id", shareId)
    .single();

  if (shareError || !share) {
    return NextResponse.json(
      { error: "Share not found" },
      { status: 404 }
    );
  }

  if (share.user_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // Delete the share
  const { error } = await supabase
    .from("shares")
    .delete()
    .eq("id", shareId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { deleted: true } });
}