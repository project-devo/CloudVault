# CloudVault

CloudVault is a secure, personal cloud storage application designed with a dark aurora aesthetic. Built using **Next.js 14 (App Router)**, **Supabase (Database, Auth & Storage)**, and **Tailwind CSS**, it offers instant media previews, smooth transitions, and folder management.

---

## ✨ Key Features

### 🔍 Unified Media Preview Engine
Instantly preview assets in-browser without forced downloads:
* **Images**: High-performance viewer supporting zoom, pan, rotation, and checkerboard transparency backgrounds for PNGs/SVGs.
* **Audio**: Custom media player with spinning vinyl artwork, a pulsing wave visualizer, seek progress bar, loop, and volume controls.
* **Video**: Immersive HTML5 video player with keyboard hotkeys (Space to toggle, arrows to seek/volume, F to fullscreen, M to mute).
* **Code & Text**: Monaco-like raw text browser featuring gutter line numbers, word-wrap toggling, clipboard copy, and real-time in-file keyword searching.
* **Markdown**: Split view switcher supporting rendered markdown preview and raw markdown source.
* **PDFs**: Seamless iframe embedding served with inline headers.

### 📁 Vault & File Management
* **Directory Trees**: Create folders, organize files, and navigate through breadcrumb paths.
* **Filter Categories**: Instant sidebar filters for Images, Documents, Videos, Audio, and Archives.
* **Starred & Trash**: Tag important files or safely move deleted items to the trash folder (supports restorations or permanent deletions).
* **Quota Tracking**: Storage usage indicator showing remaining capacity from the 1 GB free allocation.

### ⚡ Premium Loading UX & Animations
* **Navigation click Interceptor**: Custom React Context and event hooks capture link double-clicks to display branded load overlays immediately during transitions.
* **Next.js Suspense Skeletons**: Dashboard outlines pulse and top progress lines animate (`animate-aurora-shift`) when server pages resolve.
* **React Portals**: Modal elements are portaled directly to the document root to avoid layout stacking context clipping.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
* **Database & Auth**: Supabase (PostgreSQL, Row-Level Security)
* **Storage Provider**: Supabase Storage Buckets
* **Icon Library**: Lucide React

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18.x or later)
* A Supabase Account

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/project-devo/CloudVault.git
   cd CloudVault
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root folder, copying from `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Database Schema Setup**
   The application requires tables for `files` and `folders`. Run the schema script located in `lib/schema.sql` inside the Supabase SQL editor.

5. **Start Local Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) inside your browser.

---

## 🔒 Security
* **Row-Level Security (RLS)** is enabled on all tables in Supabase. User queries are filtered by authenticated session IDs (`auth.uid() = user_id`) to ensure file isolation.
* Files uploaded to Supabase Storage are bucket-protected; access URLs are generated as time-restricted signed URLs.
