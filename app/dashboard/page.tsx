import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import FileExplorer from "@/components/files/FileExplorer";

interface Props {
  searchParams: { folder?: string; category?: string; q?: string };
}

const MIME_PREFIX_MAP: Record<string, string> = {
  images: "image/",
  documents: "application/",
  videos: "video/",
  audio: "audio/",
};

const ARCHIVE_MIME_TYPES = [
  "application/zip",
  "application/x-tar",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
];

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const folderId = searchParams.folder ?? null;
  const category = searchParams.category ?? "all";
  const query = searchParams.q ?? "";
  const showFolders =
    category === "all" || category === "trash" || category === "starred";

  let filesQuery = supabase
    .from("files")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (category === "trash") {
    filesQuery = filesQuery.eq("is_trashed", true);
  } else {
    filesQuery = filesQuery.eq("is_trashed", false);

    if (category === "starred") {
      filesQuery = filesQuery.eq("is_starred", true);
    } else if (folderId) {
      filesQuery = filesQuery.eq("folder_id", folderId);
    } else if (category === "all") {
      filesQuery = filesQuery.is("folder_id", null);
    } else if (category === "archives") {
      filesQuery = filesQuery.in("type", ARCHIVE_MIME_TYPES);
    } else if (MIME_PREFIX_MAP[category]) {
      filesQuery = filesQuery.ilike("type", `${MIME_PREFIX_MAP[category]}%`);
    }
  }

  if (query) {
    filesQuery = filesQuery.ilike("name", `%${query}%`);
  }

  let foldersQuery = supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (category === "trash") {
    foldersQuery = foldersQuery.eq("is_trashed", true);
  } else {
    foldersQuery = foldersQuery.eq("is_trashed", false);

    if (category === "starred") {
      foldersQuery = foldersQuery.eq("is_starred", true);
    } else if (category === "all") {
      if (folderId) {
        foldersQuery = foldersQuery.eq("parent_id", folderId);
      } else {
        foldersQuery = foldersQuery.is("parent_id", null);
      }
    }
  }

  if (query && showFolders) {
    foldersQuery = foldersQuery.ilike("name", `%${query}%`);
  }

  const [{ data: files }, { data: fetchedFolders }] = await Promise.all([
    filesQuery,
    foldersQuery,
  ]);

  const folders = showFolders ? fetchedFolders ?? [] : [];
  type BreadcrumbFolder = {
    id: string;
    name: string;
    parent_id: string | null;
  };

  const breadcrumbs: { id: string; name: string }[] = [];
  if (folderId) {
    let currentId: string | null = folderId;

    while (currentId) {
      const response = await supabase
        .from("folders")
        .select("id, name, parent_id")
        .eq("id", currentId)
        .single();
      const folder = response.data as BreadcrumbFolder | null;

      if (!folder) break;

      breadcrumbs.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parent_id;
    }
  }

  return (
    <FileExplorer
      files={files ?? []}
      folders={folders}
      currentFolderId={folderId}
      category={category}
      searchQuery={query}
      breadcrumbs={breadcrumbs}
    />
  );
}
