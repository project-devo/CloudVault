# ☁️ CloudVault — Personal Cloud Storage

A full-stack cloud storage app built with **Next.js 14**, **Supabase Storage**, **Supabase Auth**, and **Tailwind CSS**. Upload, organize, and access your files from anywhere — 1 GB free.

---

## 📁 Project Structure

```
cloud-storage/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css
│   ├── auth/
│   │   ├── login/page.tsx        # Login page
│   │   ├── signup/page.tsx       # Signup page
│   │   └── callback/route.ts    # Email confirmation handler
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard shell (sidebar + topbar)
│   │   └── page.tsx             # File explorer page
│   └── api/
│       ├── files/[id]/route.ts  # PATCH (star/trash/rename), DELETE
│       ├── folders/route.ts     # POST (create), PATCH (update)
│       └── auth/signout/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Navigation + storage meter
│   │   └── TopBar.tsx           # Search + upload button
│   └── files/
│       ├── FileExplorer.tsx     # Grid/list view with actions
│       ├── UploadModal.tsx      # Drag-and-drop upload
│       └── CreateFolderModal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   └── server.ts            # Server + admin clients
│   ├── utils.ts                 # Helpers (formatBytes, cn, etc.)
│   └── schema.sql               # Database schema (run in Supabase)
├── types/index.ts               # All TypeScript types
├── middleware.ts                # Auth routing guard
└── .env.example                 # Environment variable template
```

---

## 🖥️ Running Locally

### 1. Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | included with Node |

### 2. Clone / open the project

```bash
# If starting fresh
cd cloud-project   # your existing VS Code folder
# Place this cloud-storage/ folder inside it
cd cloud-storage
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up Supabase (free)

1. Go to https://supabase.com → **New Project**
2. Name it `cloudvault` → set a DB password → create
3. After it spins up, go to **Settings → API**
4. Copy your **Project URL** and **anon/public key**

### 5. Run the database schema

1. In Supabase dashboard → **SQL Editor → New query**
2. Paste the contents of `lib/schema.sql`
3. Click **Run**

### 6. Create the Storage bucket

1. Supabase dashboard → **Storage → New bucket**
2. Name: `user-files` | Public: **OFF** (private)
3. Go to **Policies → user-files bucket** and add:
   - **INSERT**: `auth.uid()::text = (storage.foldername(name))[1]`
   - **SELECT**: same condition
   - **DELETE**: same condition

### 7. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **⚠️ Never commit `.env.local` — it's in `.gitignore`.**

### 8. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 — you should see the landing page.

### Common errors

| Error | Fix |
|-------|-----|
| `Cannot find module '@supabase/ssr'` | Run `npm install` again |
| `Invalid API key` | Check your `.env.local` values match Supabase dashboard |
| `new row violates RLS policy` | Make sure you ran schema.sql and are logged in |
| `Bucket not found` | Create `user-files` bucket in Supabase Storage |

---

## 🚀 Deploying to the Cloud

Everything deploys free-tier. Budget: $0.

### Step 1 — Database (already hosted on Supabase)
Your Supabase project IS the cloud database. Nothing extra to do. ✅

### Step 2 — Deploy to Vercel (Frontend + Backend)

Vercel handles Next.js API Routes natively — no separate server needed.

```bash
# Install Vercel CLI
npm i -g vercel

# From the cloud-storage directory:
vercel
# Follow prompts: link to new project, Next.js auto-detected
```

**Or via UI:**
1. Push code to GitHub
2. Go to https://vercel.com → **New Project → Import from GitHub**
3. Select your repo → **Deploy**

### Step 3 — Set environment variables in Vercel

In Vercel dashboard → **Project → Settings → Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL       → your Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  → your anon key
SUPABASE_SERVICE_ROLE_KEY      → your service role key
NEXT_PUBLIC_APP_URL            → https://your-project.vercel.app
```

### Step 4 — Update Supabase auth redirect

In Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://your-project.vercel.app`
- **Redirect URLs**: `https://your-project.vercel.app/auth/callback`

### Step 5 — Redeploy and test

```bash
vercel --prod
```

Visit your live URL, sign up, upload a file — you're shipped. 🎉

---

## ✅ What's Next

1. **Signed URLs** — files are currently stored privately; add `/api/files/[id]/download` that returns a short-lived signed URL instead of a direct public URL
2. **File preview** — click images/PDFs to preview inline instead of just downloading
3. **Share links** — generate public share links with expiry for individual files
4. **Rename files/folders** — add an inline edit input in the context menu
5. **Storage tier upgrades** — integrate Stripe to unlock more quota per user
