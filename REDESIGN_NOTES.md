# CloudVault UI Redesign — Session Notes

> Move this file into your study folder to keep as a reference.

## 1. Cleanup (deleted files)

These six files were removed from the project root:

- `.codex-dev.err.log`
- `.codex-dev.log`
- `desktop-home.png`
- `mobile-dashboard.png`
- `mobile-home.png`
- `README.md` (empty — only contained "CloudVault project")

Kept: `package-lock.json` and all source/config files.

Verify yourself: `dir` in the project root, or `git log --diff-filter=D --name-only`.

---

## 2. App audit (what was there before)

Conclusion: the app is well-structured but needs Supabase setup to run.

**What was solid**
- Next.js 14 App Router + `@supabase/ssr` (correct pattern).
- `middleware.ts` gates `/dashboard` vs `/auth` properly.
- `lib/supabase/server.ts` exposes cookie-bound server client + admin client (server-only).
- API routes consistently check `auth.getUser()` and scope queries by `user_id`.
- Upload modal handled max size, session expiry, quota, and partial failure cleanly.

**What was needed to actually run**
1. Create a Supabase project, copy values into `.env.local`.
2. Create tables with RLS scoped to `auth.uid()`:
   - `folders(id, user_id, name, parent_id, is_starred, is_trashed, color, created_at, updated_at)`
   - `files(id, user_id, folder_id, name, path, size, type, is_starred, is_trashed, created_at, updated_at)`
3. Create a private storage bucket named **`user-files`** (hardcoded in code).
4. Add storage RLS so users can only access their own folder (`${auth.uid()}/`).
5. Enable the email/password auth provider in Supabase.

**One real bug found**
- `components/files/UploadModal.tsx` uses `upsert: false` with path `${user.id}/${folderId}/"root"/${file.name}`. Uploading the same filename twice into the same folder will fail with 409. Easy fix: either `upsert: true` and update the row, or prefix the path with a UUID/date.

**Minor things**
- `app/api/files/[id]` GET uses 60s signed URL; passes `download: file.name` but no `Content-Disposition: attachment` override — browsers may render instead of download.
- `DEFAULT_STORAGE_QUOTA_BYTES` is enforced only client-side; not a server-side guard.
- Dashboard `app/dashboard/page.tsx` should be checked that initial fetch uses the server client for consistent RLS in SSR.

---

## 3. UI redesign — Apple-inspired "aurora" theme

### Color story
- Old: blue `brand-*` palette.
- New: violet (`#7C5CFF`) → coral (`#FF7A59`) gradient accents.
- Background: near-black `ink-950` (`#0A0A0F`) → `ink-900` (`#0F0F17`) with radial aurora glows.
- Surfaces: frosted glass — `backdrop-blur` + 70% opacity + 1px white/10% border.
- Every `brand-*` class removed (verified via grep).

### Files changed (13)

| File | Change |
|---|---|
| `tailwind.config.ts` | New `accent` + `coral` + `ink` palettes, shadows, Apple easings, keyframes (`auroraShift`, `shimmer`, `blurIn`, `scaleIn`, `pulse-soft`). |
| `app/globals.css` | Rewrote `.btn-primary`, `.card`, `.input`; added `.btn-glass`, `.card-interactive`, `.nav-pill`, `.segmented`, `.sheet`, `.dropzone`, `.aurora-text`, `.safe-stagger`; film-grain overlay; `prefers-reduced-motion` + `prefers-reduced-transparency` fallbacks. |
| `app/layout.tsx` | Inter font as CSS variable, `themeColor`, noise background. |
| `app/page.tsx` | Restyled landing — aurora-shifting headline, frosted CTA, glass feature cards. |
| `app/auth/login/page.tsx` | Glass card, blur-in, aurora background glows. |
| `app/auth/signup/page.tsx` | Same system + gradient success state. |
| `app/dashboard/layout.tsx` | (via `DashboardShell.tsx`) — ambient aurora blobs behind everything. |
| `components/layout/Sidebar.tsx` | **Floating glass panel** (no border, just blur). Animated `nav-pill` with moving aurora highlight. Glass storage card with gradient bar. |
| `components/layout/TopBar.tsx` | Unified **glass** bar — search + Upload. |
| `components/files/FileExplorer.tsx` | Frosted file/folder cards with hover lift, segmented grid/list toggle, gradient icon tiles. |
| `components/files/UploadModal.tsx` | Apple-style sheet (blur backdrop, scale-in panel), aurora dropzone, shimmer progress. |
| `components/files/CreateFolderModal.tsx` | Glass sheet with the same motion system. |
| `components/layout/DashboardShell.tsx` | Wraps the page with the aurora wash. |

No new dependencies. No backend/DB changes.

### Verification (run yourself)
```bash
npx tsc --noEmit          # clean
npx next lint             # clean (1 pre-existing warning in UploadModal.tsx)
npx next build            # 10 routes generated
```

`.eslintrc.json` was added (extends `next/core-web-vitals`) so `next lint` runs non-interactively.

---

## 4. Git

- One commit on `main`: `cbf2859 — Redesign UI with aurora violet + coral accent` (13 files, +802 / -314).
- **Did not push** — you said you'd push from your own terminal.
- When you push:
  ```bash
  git push -u origin main
  ```
  If the remote default is `master`:
  ```bash
  git push -u origin main:master
  ```

> Heads up: local branch is `main`, but git reported "Your branch is ahead of 'origin/master' by 6 commits". There are 5 earlier commits you haven't pushed yet. Decide which branch should be the default and either rename one or set `main` to track `origin/master`.

---

## 5. Vercel + Supabase setup (so the app actually runs)

### Vercel
1. https://vercel.com/new → import `project-devo/CloudVault` → framework auto-detect: Next.js.
2. Settings → Environment Variables (do NOT commit these):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark as sensitive)
   - `NEXT_PUBLIC_APP_URL` — set to your Vercel URL after first deploy (e.g. `https://cloudvault.vercel.app`)
   - `NEXT_PUBLIC_MAX_UPLOAD_SIZE` (optional, defaults to 50 MB)
3. After first deploy, update `NEXT_PUBLIC_APP_URL` and redeploy so Supabase auth redirect points to the right URL.

### Supabase
- Dashboard: https://supabase.com/dashboard
- Auth (email/password): https://supabase.com/docs/guides/auth/auth-email
- Row-Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Storage buckets + RLS: https://supabase.com/docs/guides/storage/security/access-control
- After deploy, in Supabase → Authentication → URL Configuration:
  - **Site URL**: your Vercel URL.
  - **Redirect URLs**: include `https://<your-app>.vercel.app/auth/callback`.

---

## 6. How to verify everything

| What | Where to look |
|---|---|
| Files I deleted | They no longer exist; `dir` in project root or `git log --diff-filter=D --name-only` |
| Files I changed | `git log --name-status -1` or `git show --stat cbf2859` |
| Color tokens | `tailwind.config.ts` — search for `accent:` and `coral:` |
| Reusable styles | `app/globals.css` — `@layer components { … }` block |
| Per-page UI | `app/page.tsx`, `app/auth/*`, `app/dashboard/*`, `components/files/*`, `components/layout/*` |
| Build/lint pass | `npx tsc --noEmit`, `npx next lint`, `npx next build` — should match what I reported |
| Commit | `git log --oneline -1` shows `cbf2859 Redesign UI with aurora violet + coral accent` |

---

## 7. Where to learn the techniques (so you can do them yourself)

### Tailwind CSS — design tokens & utilities
- https://tailwindcss.com/docs/theme — extending `theme.extend.colors`, `boxShadow`, `animation`, `keyframes`.
- I used "extend" (not replace) so default utilities still work.

### Backdrop blur (frosted glass)
- Tailwind `backdrop-blur-{sm,md,lg,xl,2xl,3xl}` + low-opacity backgrounds (`bg-white/[0.04]`) on top of dark/colored layers. Apple's exact technique.
- https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter

### Apple-style motion (cubic-bezier easings)
- Canonical "in-out": `cubic-bezier(0.32, 0.72, 0, 1)` (I named it `apple` in `tailwind.config.ts`).
- https://www.figma.com/blog/smooth-motion-design-principles/
- https://m3.material.io/styles/motion

### Animated gradient text
- `bg-gradient-to-r` + `-webkit-background-clip: text` + `color: transparent` (`.aurora-text` in `globals.css`).
- https://tailwindcss.com/docs/background-image#adding-a-linear-gradient

### Staggered list animations
- Pure CSS with `nth-child` `animation-delay` (the `.safe-stagger > *:nth-child(n)` block).
- For more complex orchestration, Framer Motion: https://www.framer.com/motion/

### Accessibility fallbacks
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency (Safari only — included for completeness)

### Vercel deployment
- https://vercel.com/docs/getting-started-with-vercel
- https://vercel.com/docs/frameworks/nextjs
- https://vercel.com/docs/projects/environment-variables

### Supabase (to make the app run)
- https://supabase.com/dashboard
- https://supabase.com/docs/guides/auth/auth-email
- https://supabase.com/docs/guides/auth/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control

### Git basics
- `git status`, `git diff --stat`, `git add -A`, `git commit -m "…"` — https://git-scm.com/doc
