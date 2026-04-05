import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import { DEFAULT_STORAGE_QUOTA_BYTES } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch storage stats for sidebar
  const { data: files } = await supabase
    .from("files")
    .select("size")
    .eq("user_id", user.id)
    .eq("is_trashed", false);

  const usedBytes = files?.reduce((sum, f) => sum + (f.size || 0), 0) ?? 0;
  const totalBytes = DEFAULT_STORAGE_QUOTA_BYTES;

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      usedBytes={usedBytes}
      totalBytes={totalBytes}
    >
      {children}
    </DashboardShell>
  );
}
