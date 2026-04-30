## SQL Grader — Build Plan

A responsive web app where students answer SQL questions against an Oracle SCOTT-style schema. Each submission is executed against your Oracle Cloud DB, the result is compared to a reference query's result, and Lovable AI generates feedback. Admins manage questions.

> Note: This will be built **inside the current Foliant project** (replacing the book-reader UI) unless you'd rather start a brand-new Lovable project. Say the word and I'll spin up a fresh one instead.

### 1. Oracle connection (you provide)

Before building, you'll need to give us, via the secrets prompt:
- `ORACLE_CONNECT_STRING` — e.g. `(description=...)` TNS or `host:port/service`
- `ORACLE_GRADER_USER` — a **read-only** Oracle user with `SELECT` on the SCOTT tables (no DDL/DML/DROP). This user runs every student query.
- `ORACLE_GRADER_PASSWORD`
- `ORACLE_WALLET_BASE64` *(if Autonomous DB requires mTLS wallet)* — base64 of the wallet zip

You are responsible for creating that locked-down Oracle user. Suggested grants:
```sql
CREATE USER grader IDENTIFIED BY "...";
GRANT CREATE SESSION TO grader;
GRANT SELECT ON scott.emp TO grader;
GRANT SELECT ON scott.dept TO grader;
GRANT SELECT ON scott.salgrade TO grader;
GRANT SELECT ON scott.bonus TO grader;
ALTER USER grader PROFILE <profile_with_low_cpu_and_idle_limits>;
```

### 2. Lovable Cloud (Postgres) schema

Used only for app metadata — never for student SQL execution.

| Table | Purpose |
|---|---|
| `profiles` | already exists |
| `user_roles` | already exists (`admin`, `user`) |
| `questions` | id, title, prompt, difficulty, reference_sql, expected_columns (jsonb), order_sensitive (bool), max_score, created_by, created_at |
| `submissions` | id, user_id, question_id, submitted_sql, score, passed (bool), exec_ms, error, ai_feedback, result_preview (jsonb), created_at |

RLS:
- `questions`: SELECT for any authenticated user; INSERT/UPDATE/DELETE only for `admin`.
- `submissions`: users see/insert their own; admins can SELECT all.

The existing `books`, `book_pages`, `bookmarks` tables and Foliant pages will be removed.

### 3. Edge function: `grade-sql`

Called by the frontend on every submission. Steps:

1. Verify JWT → get `user_id`.
2. Validate input with Zod: `{ question_id: uuid, sql: string (max 5000 chars) }`.
3. Static safety filter on `sql`: reject if it contains `;` (multiple statements), or matches `\b(INSERT|UPDATE|DELETE|MERGE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|CALL|EXECUTE|BEGIN|DECLARE)\b` (case-insensitive). Only `SELECT … [WITH …]` allowed.
4. Load `questions.reference_sql` and config from Postgres.
5. Open Oracle connection using `npm:oracledb` with the read-only grader user. Set:
   - `CALL_TIMEOUT = 5000ms` per query
   - `maxRows = 1000`
   - autocommit irrelevant (read-only)
6. Run reference query → `expectedRows`.
7. Run student query → `actualRows` (or capture Oracle error).
8. Compare:
   - Same column count? Same column names (case-insensitive)?
   - Same row count?
   - Row-by-row equality. If `order_sensitive=false`, sort both sets by stringified-row before comparing.
   - Score = `max_score` if exact match, partial credit (`max_score/2`) if columns + row count match but values differ, else 0.
9. Call Lovable AI (`google/gemini-3-flash-preview`) with: question prompt, reference SQL (kept server-side, never returned to client), student SQL, expected vs actual preview, exec error if any. Ask for short feedback explaining what's right/wrong — no answer leaks.
10. Insert into `submissions`, return `{ score, passed, feedback, result_preview, error }` to the frontend. **Never return `reference_sql` or `expectedRows`.**

Per-user rate limit: in-memory map, max 1 submission / 2 sec / user (best-effort; documented as not production-grade).

### 4. Frontend pages

- `/` — landing (replace Foliant landing): pitch + CTA to sign in.
- `/auth` — keep existing email/password + Google flow; rename branding.
- `/practice` — student home: list of questions with difficulty badges and "solved/attempted" status from `submissions`.
- `/practice/:questionId` — split view:
  - Left: question prompt, schema reference (EMP/DEPT/etc.), past attempts list.
  - Right: SQL editor (CodeMirror via `@uiw/react-codemirror` + `@codemirror/lang-sql`), "Run & grade" button, results table, score, AI feedback panel.
- `/admin/questions` — admin only:
  - Table of questions.
  - Create/edit form: title, prompt (markdown), reference SQL, max score, order-sensitive toggle, difficulty.
  - "Test reference query" button → runs reference SQL against Oracle and shows result so the admin can verify before saving.
- `/admin/submissions` — admin only: browse all submissions, filter by user/question.
- Navbar: Practice • Admin (if admin) • theme toggle • sign out. Keep existing dark/light theme system.

Route guards:
- `/practice*` requires auth.
- `/admin*` requires `has_role(uid, 'admin')`. Client checks via a `useUserRole` hook + RLS enforces server-side.

### 5. Bootstrapping the first admin

After you sign up, we'll insert one row manually:
```sql
INSERT INTO user_roles (user_id, role) VALUES ('<your-uid>', 'admin');
```
We'll do this via a one-shot insert tool call after you give us your email/uid.

### 6. Seed content

Five starter questions covering SCOTT (list all clerks; salaries > avg; dept with most employees; employees with no manager; join EMP+DEPT for dept names). Inserted via a follow-up `INSERT` once you've confirmed the Oracle connection works.

### Technical notes

- **Oracle driver**: `oracledb` npm package works in Deno via `npm:oracledb`. Thin mode (no Instant Client) is preferred — works with username/password and with Autonomous DB if you use the connection string from the wallet's `tnsnames.ora`. If your DB requires the wallet, we decode `ORACLE_WALLET_BASE64` to a temp dir per invocation and point `TNS_ADMIN` at it.
- **Cold starts**: first call per edge function instance pays the Oracle handshake (~1–2s). Acceptable for a learning tool.
- **Result comparison**: numbers compared with `Number()` equality, dates via ISO string, NULL via `null`.
- **Editor**: CodeMirror SQL mode gives syntax highlighting + autocomplete on EMP/DEPT columns (we feed it a static schema hint).
- **No streaming** for AI feedback — short response, plain `invoke()` call to keep code simple.
- **Security memory** will be updated to record: "All student SQL must run only via the `grade-sql` edge function using the locked-down Oracle grader user. Never accept SQL from the client to be executed elsewhere."

### What I'll do once you approve

1. Ask you to add the Oracle secrets via the secrets tool.
2. Run a migration: drop book tables, create `questions` + `submissions` with RLS.
3. Build the `grade-sql` edge function and deploy it.
4. Build all pages above and wire up routing/role guards.
5. Ask for your user UID to grant admin, then seed the 5 sample questions.
6. Test end-to-end against your Oracle DB and report back.

Approve and I'll start with the secrets request.