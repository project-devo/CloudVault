-- ═══════════════════════════════════════════════════════════════
-- CLOUD STORAGE — Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Folders table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES folders(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  color       TEXT DEFAULT '#4f7cf8',
  is_starred  BOOLEAN DEFAULT FALSE,
  is_trashed  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Files table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  size        BIGINT NOT NULL DEFAULT 0,        -- bytes
  type        TEXT NOT NULL DEFAULT 'application/octet-stream',
  path        TEXT NOT NULL,                    -- Supabase storage path
  folder_id   UUID REFERENCES folders(id) ON DELETE SET NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_starred  BOOLEAN DEFAULT FALSE,
  is_trashed  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- ─── Auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security (RLS) — users only see their own data ──
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Users can view own files"
  ON files FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON files FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON files FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE USING (auth.uid() = user_id);

-- Folders policies
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE USING (auth.uid() = user_id);

-- ─── Shares table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shares (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id     UUID REFERENCES files(id) ON DELETE CASCADE,
  folder_id   UUID REFERENCES folders(id) ON DELETE CASCADE,
  password    TEXT,              -- SHA-256 hashed password, NULL = no password
  expires_at  TIMESTAMPTZ,       -- NULL = never expires
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  -- Exactly one of file_id or folder_id must be set
  CONSTRAINT check_share_target CHECK (
    (file_id IS NOT NULL AND folder_id IS NULL) OR
    (file_id IS NULL AND folder_id IS NOT NULL)
  ),

  -- One active share per resource (revoke and recreate to rotate)
  CONSTRAINT unique_file_share UNIQUE (file_id),
  CONSTRAINT unique_folder_share UNIQUE (folder_id)
);

CREATE INDEX IF NOT EXISTS idx_shares_user_id   ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_file_id   ON shares(file_id);
CREATE INDEX IF NOT EXISTS idx_shares_folder_id ON shares(folder_id);

CREATE TRIGGER update_shares_updated_at
  BEFORE UPDATE ON shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Shares RLS ───────────────────────────────────────────────
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Owner can read / insert / update / delete their own share rows.
CREATE POLICY "Users can manage own shares"
  ON shares FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone (including anonymous visitors) may read share metadata
-- (needed for the public /share/:id page to resolve the link).
CREATE POLICY "Public can read share metadata"
  ON shares FOR SELECT
  USING (true);

-- ─── Recursive Subfolder Security Helper ──────────────────────
-- Returns TRUE when `target_id` is equal to or a descendant of `root_id`.
-- Used by the public share API to prevent path-traversal above the root.
CREATE OR REPLACE FUNCTION is_subfolder_of(target_id UUID, root_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  curr UUID := target_id;
BEGIN
  -- Exact match
  IF target_id = root_id THEN RETURN TRUE; END IF;
  -- Walk up the parent chain
  LOOP
    SELECT parent_id INTO curr FROM folders WHERE id = curr;
    EXIT WHEN curr IS NULL;
    IF curr = root_id THEN RETURN TRUE; END IF;
  END LOOP;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── Storage bucket (run separately in Storage section or SQL) ─
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('user-files', 'user-files', false)
-- ON CONFLICT DO NOTHING;

-- CREATE POLICY "Users can upload own files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can read own files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own files"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
-- ─── Shares table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shares (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token       UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
  resource_id UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for shares
CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_resource ON shares(resource_type, resource_id);

-- Enable RLS on shares
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Shares policies
CREATE POLICY "Users can view own shares"
  ON shares FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shares"
  ON shares FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares"
  ON shares FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares"
  ON shares FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at (using the existing function)
DROP TRIGGER IF EXISTS update_shares_updated_at ON shares;
CREATE TRIGGER update_shares_updated_at
  BEFORE UPDATE ON shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
