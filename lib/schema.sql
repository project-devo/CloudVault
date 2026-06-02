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
