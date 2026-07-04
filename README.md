# CloudVault

CloudVault is a secure, personal cloud storage application featuring a modern dark interface. Built on Next.js 14, Supabase, and Tailwind CSS, the application offers dynamic in-browser media previews, responsive layouts, and granular file organization.

---

## Key Features

### Media Preview Engine
The application renders files inline to prevent unnecessary download prompts:
* **Images**: Custom viewer with smooth zoom, pan, and 90-degree canvas rotation, including a checkered transparency grid pattern for PNG and SVG files.
* **Audio**: Custom media player interface containing a spinning vinyl label animation, a styled seeker track, time metrics, and custom volume controls.
* **Video**: Immersive player component wrapped with keyboard controls (Space to toggle play, arrows to seek/adjust volume, F for full-screen, M to mute).
* **Text and Code**: Editor-style text reader with line numbers, copy-to-clipboard actions, word-wrap toggles, and regex-based keyword search highlighting.
* **Markdown**: Toggle-based viewer allowing seamless switching between rendered HTML content and raw Markdown source code.
* **PDFs**: In-browser document viewer using iframe redirects with inline content disposition.

### Storage and File Management
* **Hierarchical Organization**: Create directories, nest folders recursively, and navigate folders using breadcrumb links.
* **Smart Filtering**: Sidebar categories to sort files by Images, Documents, Videos, Audio, and Archives.
* **Actions**: Star files for quick access, move files to the trash container, and permanently delete or restore items.
* **Usage Quota**: visual remaining storage capacity tracker based on a default 1 GB limit.

### Performance and Transition Enhancements
* **Click Interception**: Custom context listeners hook into folder double-clicks and category navigations to immediately display loading overlays while Next.js routes settle.
* **Skeleton Loaders**: Custom React Suspense fallbacks displaying layout outlines and an animated top progress line when loading server component pages.
* **Stacking Context Portals**: The preview modal is portaled directly into the document body to break out of nested layout styling and display on top of navigation menus.

---

## Technical Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
* **Backend Services**: Supabase Database (PostgreSQL) and Supabase Auth
* **Storage Provider**: Supabase Storage Buckets
* **Icon Suite**: Lucide React

---

## Local Development Setup

### Prerequisites
Ensure you have Node.js (v18.x or later) installed and a Supabase project created.

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/project-devo/CloudVault.git
   cd CloudVault
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory based on the `.env.example` template:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Schema Initialization**
   Run the SQL statements located in `lib/schema.sql` inside the Supabase SQL console to initialize the files and folders database structures.

5. **Start Dev Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 inside your web browser.

---

## Security
* **Row-Level Security (RLS)** is applied to the PostgreSQL tables. User sessions restrict database queries using current session credentials (`auth.uid() = user_id`) to enforce strict privacy.
* Storage operations generate temporary signed URLs (60-second expiration) to protect assets from unauthorized hotlinking.
