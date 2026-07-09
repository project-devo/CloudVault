import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Cache for schema detection
let schemaType: 'legacy' | 'modern' | null = null;
// legacy: { id, user_id, file_id, folder_id, password, expires_at, created_at, updated_at }
// modern: { id, token, resource_type, resource_id, user_id, expires_at, created_at, updated_at }

async function getSchemaType(supabase: ReturnType<typeof createServerSupabaseClient>) {
  if (schemaType !== null) {
    return schemaType;
  }
  try {
    // Try to detect which schema exists by checking for the presence of the 'file_id' column
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'shares')
      .eq('column_name', 'file_id');
    if (error) {
      // If we cannot query information_schema, fallback to assuming legacy
      // (since the original schema had file_id/folder_id)
      console.warn('Failed to detect shares table schema via information_schema, assuming legacy:', error);
      schemaType = 'legacy';
    } else {
      if (columns && columns.length > 0) {
        const columnNames = columns.map((c: any) => c.column_name);
        if (columnNames.includes('file_id')) {
          schemaType = 'legacy';
        } else {
          schemaType = 'modern';
        }
      } else {
        schemaType = 'legacy';
      }
    }
  } catch (e) {
    console.error('Failed to detect schema type:', e);
    schemaType = 'legacy';
  }
  return schemaType;
}

// GET /api/shares/:id - get share by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;

  const schema = await getSchemaType(supabase);

  let selectQuery: string;
  if (schema === 'legacy') {
    selectQuery = `
      id,
      user_id,
      file_id,
      folder_id,
      password,
      expires_at,
      created_at,
      updated_at
    `;
  } else {
    selectQuery = `
      id,
      token,
      resource_type,
      resource_id,
      user_id,
      expires_at,
      created_at,
      updated_at
    `;
  }

  const { data, error } = await supabase
    .from('shares')
    .select(selectQuery)
    .eq('id', id)
    .single();

  const share = data as any;

  if (error || !share) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }

  // Transform to the format expected by the frontend
  let transformed: any;
  if (schema === 'legacy') {
    transformed = {
      id: share.id,
      file_id: share.file_id,
      folder_id: share.folder_id,
      has_password: !!share.password,
      expires_at: share.expires_at,
      created_at: share.created_at,
      updated_at: share.updated_at,
      // We don't have file/folder details in the share table itself, so we need to fetch them
      // But the frontend's SharePage expects file and/or folder objects in the share data.
      // We'll fetch them separately if needed.
      file: share.file_id ? null : null, // placeholder
      folder: share.folder_id ? null : null, // placeholder
    };
    // Fetch file or folder details if needed
    if (share.file_id) {
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('id, name, type, size, path')
        .eq('id', share.file_id)
        .single();
      if (!fileError && file) {
        transformed.file = {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          path: file.path,
        };
      }
    }
    if (share.folder_id) {
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('id, name')
        .eq('id', share.folder_id)
        .single();
      if (!folderError && folder) {
        transformed.folder = {
          id: folder.id,
          name: folder.name,
        };
      }
    }
  } else {
    // modern schema
    transformed = {
      id: share.id,
      token: share.token,
      resource_type: share.resource_type,
      resource_id: share.resource_id,
      user_id: share.user_id,
      expires_at: share.expires_at,
      created_at: share.created_at,
      updated_at: share.updated_at,
    };
    // The frontend's SharePage expects file_id and folder_id, so we compute them
    // based on resource_type and resource_id.
    // Also, it expects file and folder objects.
    // We'll set file_id and folder_id accordingly, and fetch the related object.
    if (share.resource_type === 'file') {
      transformed.file_id = share.resource_id;
      transformed.folder_id = null;
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('id, name, type, size, path')
        .eq('id', share.resource_id)
        .single();
      if (!fileError && file) {
        transformed.file = {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          path: file.path,
        };
      } else {
        transformed.file = null;
      }
      transformed.folder = null;
    } else if (share.resource_type === 'folder') {
      transformed.file_id = null;
      transformed.folder_id = share.resource_id;
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('id, name')
        .eq('id', share.resource_id)
        .single();
      if (!folderError && folder) {
        transformed.folder = {
          id: folder.id,
          name: folder.name,
        };
      } else {
        transformed.folder = null;
      }
      transformed.file = null;
    }
  }

  return NextResponse.json({ data: transformed });
}

// DELETE /api/shares/:id - delete a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;

  // Delete the share
  const { error } = await supabase
    .from("shares")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { deleted: true } });
}