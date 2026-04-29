## BookReaderApp — Build Plan

A polished online book reader with auth, a seeded library, per-user bookmarks, and theme switching.

### Pages & navigation

- **Top nav bar** (sticky): app logo/name, "Library" link, theme toggle (sun/moon), and an auth slot (Sign in / avatar menu with Sign out).
- **/** — Landing/Home: hero with gradient, "Browse the library" CTA. If logged in, redirects to /library.
- **/auth** — Combined Sign in / Sign up tabs. Email + password and Google sign-in. Forgot password link.
- **/reset-password** — Set new password (required for the reset flow).
- **/library** — Grid of book cards (cover, title, author, short description). Each card shows a "Continue reading — page X" badge if the user has a bookmark. Hover lift + gradient border effect.
- **/book/:id** — Reader screen: book title/author header, scrollable paginated content, prev/next page controls, page indicator (e.g. "Page 3 of 24"), and a Bookmark button that saves current page. Auto-resume to last bookmarked page on open.
- **404** — keeps existing NotFound.

### Reader behavior

- Books are stored as ordered chapters/pages of plain text in the database.
- Reader shows one "page" at a time (a chapter or a fixed-size text chunk), scrollable within a comfortable max-width column with serif typography and good line-height.
- Keyboard arrows and on-screen buttons advance pages.
- "Bookmark this page" saves `{book_id, user_id, page, updated_at}`. One bookmark per user per book (upsert). Re-opening the book jumps to that page.

### Theming

- Light + dark mode using CSS variables already in `index.css`. Add brand colors (primary gradient, accent) via HSL tokens.
- Theme toggle persists to `localStorage` and respects `prefers-color-scheme` on first visit.
- Polished visual layer: subtle gradients on hero and cards, hover lift, focus rings, skeleton loaders for library and reader, smooth transitions.
- Fully responsive (mobile nav collapses, reader column adapts, library grid reflows).

### Backend (Lovable Cloud / Supabase)

Tables:

- `profiles` — `id (uuid, PK, references auth.users)`, `display_name`, `created_at`. Auto-created via trigger on signup. RLS: user can read/update own row.
- `books` — `id`, `title`, `author`, `description`, `cover_url` (nullable), `created_at`. RLS: public read; writes restricted to admins.
- `book_pages` — `id`, `book_id (FK)`, `page_number`, `content (text)`. RLS: public read; admin write. Unique `(book_id, page_number)`.
- `bookmarks` — `id`, `user_id (FK auth.users)`, `book_id (FK)`, `page`, `updated_at`. Unique `(user_id, book_id)`. RLS: user can CRUD only own rows.
- `user_roles` + `app_role` enum + `has_role()` security-definer function (so an admin role exists for future content management; not exposed in UI for v1).

Auth: Email/password + Google sign-in. Signup uses `emailRedirectTo: window.location.origin`. Password reset uses `/reset-password`. Session handled via `onAuthStateChange` listener set up before `getSession()`.

Seed data: 5 sample public-domain books (e.g., short stories / classics excerpts), each with a handful of pages, inserted via a data migration so the app is usable immediately.

### Out of scope for v1

- Admin UI for adding books (data is seeded; admin role exists for later).
- PDF/EPUB upload.
- Highlights, notes, multi-device sync beyond bookmark page.

### Build order

1. Design system tokens (gradients, brand colors) + nav bar + theme toggle + routing skeleton.
2. Enable Lovable Cloud, create tables, RLS, profile trigger, roles function, seed 5 books.
3. Auth pages (sign in / sign up / Google / forgot + reset-password page).
4. Library page wired to `books` + bookmark badge.
5. Reader page with pagination, bookmark save/resume, keyboard nav.
6. Polish: skeletons, hover states, responsive pass, empty/error states.

### Technical notes

- React + Vite + Tailwind + shadcn/ui (already installed).
- Supabase client via Lovable Cloud auto-generated config.
- Roles stored in separate `user_roles` table with `has_role()` security-definer function to avoid recursive RLS.
- Bookmarks use `upsert` on `(user_id, book_id)` unique index.
- All inputs validated with `zod` (email, password length on auth forms).
