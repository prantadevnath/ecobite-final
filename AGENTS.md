# AGENTS.md

## Cursor Cloud specific instructions

### Overview

EcoBite is a food waste reduction marketplace (similar to Too Good To Go). Full-stack TypeScript monorepo with:
- **Frontend**: React 19 + Vite 7 + TailwindCSS v4 + shadcn/ui (in `client/`)
- **Backend**: Express.js + tRPC v11 (in `server/`)
- **Database**: PostgreSQL via Drizzle ORM (schema in `drizzle/schema.ts`)
- **Shared types**: `shared/`

### Prerequisites

- **PostgreSQL** must be running. Start with `sudo pg_ctlcluster 16 main start` or `sudo service postgresql start`.
- **Database**: `ecobite` database owned by user `ecobite` (password: `ecobite`) on localhost:5432.
- **`.env` file** at repo root with at minimum:
  ```
  DATABASE_URL=postgresql://ecobite:ecobite@localhost:5432/ecobite
  JWT_SECRET=dev-jwt-secret-ecobite-2024
  NODE_ENV=development
  VITE_APP_ID=ecobite
  ```
  `VITE_APP_ID` must be non-empty or JWT session verification will silently fail (the `verifySession` method rejects empty `appId`).

### Key commands

See `package.json` scripts for the canonical list:
- `pnpm dev` — starts Express + Vite dev server on port 3000 (with HMR)
- `pnpm test` — runs Vitest (14 tests, all mocked, no DB needed)
- `pnpm check` — TypeScript type-check (has pre-existing errors, does not block runtime)
- `pnpm db:push` — push Drizzle schema to PostgreSQL
- `pnpm build` — production build (Vite frontend + esbuild backend)

### Known issues / gotchas

1. **`server/db.ts` uses MySQL syntax with PostgreSQL** — The original code uses `onDuplicateKeyUpdate` (MySQL) and unquoted camelCase column names in raw SQL. These must be `onConflictDoUpdate` (PostgreSQL) and column names must be double-quoted (e.g., `"quantityAvailable"`) in raw `sql` template literals. A fix is included in this setup PR.
2. **TypeScript errors are pre-existing** — `pnpm check` reports ~9 errors (missing type exports, `pg` types, MySQL-specific API usage). These do not affect runtime since `tsx watch` and `vitest` skip type checking.
3. **Hot-reload (tsx watch)** restarts the entire server process on file changes in `server/`. The Vite HMR handles frontend changes without full restart.
4. **OAuth warnings** — `[OAuth] ERROR: OAUTH_SERVER_URL is not configured` is expected and harmless; email/password auth works without OAuth.
5. **Restaurant signup** automatically creates a "pending" restaurant entry. To test the full flow, an admin must approve it, or insert an approved restaurant directly via SQL.
