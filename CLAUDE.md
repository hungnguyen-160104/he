@AGENTS.md

# ExamHub THPT — rules for Claude Code sessions

**Source of truth:** `EXAMHUB_THPT_CLAUDE_CODE_MASTER_PROMPT.md` (product spec, locked decisions). Then `docs/*`.
**Before doing anything:** read `docs/PROGRESS.md` → continue from its `NEXT ACTION`. Do not restart phases.

## Stack (do not change without an ADR in docs/ARCHITECTURE.md)
- Next.js 16 App Router, TypeScript strict, pnpm, **Cache Components disabled** (ADR-002).
- Next 16 specifics: `params`/`searchParams` are Promises; use `PageProps<"/route">` / `LayoutProps`; `proxy.ts` replaces `middleware.ts`; error boundaries receive `{ error, retry }`; `revalidateTag(tag, profile)` needs 2 args. Read `node_modules/next/dist/docs/` before using an unfamiliar API.
- NextAuth **v4.24 (stable Auth.js line)** Credentials + JWT session (ADR-003). Argon2id via `@node-rs/argon2`.
- Mongoose 9 + MongoDB Atlas; Zod 4; Tailwind 4 (`@tailwindcss/turbopack` loader, no PostCSS); shadcn/ui (Radix) — `cn` comes from the `cn` package (shadcn's own) re-exported by `@/lib/utils`.
- Vitest 5 (unit + integration with mongodb-memory-server), Playwright (E2E via `scripts/e2e-server.ts`).

## Layering
- `src/app/**` routes only: authenticate → validate (Zod) → call `modules/<domain>/service` → format. Wrap Route Handlers with `apiHandler()` and read bodies with `readJson()` (`src/lib/api/handler.ts`).
- `src/modules/<domain>/`: `model.ts` (Mongoose, server-only), `repository.ts`, `service.ts` (RBAC + ownership checks live HERE), `dto.ts` (explicit projections), `validation.ts` (pure Zod, client-safe), `permissions.ts`.
- Never import mongoose/models/repositories from Client Components or `src/components/**` (ESLint enforces).
- Answer keys (`question_keys`) are only read by grader/editor services. Student-facing DTOs must be built from explicit allow-lists.

## Conventions
- UI text, errors, docs for users: **Vietnamese**. Code identifiers/comments: English.
- API envelope: `{ success: true, data, meta? }` / `{ success: false, error: { code, message, details? } }`.
- Scores: integer `scoreScaled` 0..10000; Decimal.js inside grading; never float math for points.
- Time: store UTC; periods computed in `Asia/Ho_Chi_Minh`, weeks start Monday.
- No `any`, no `@ts-ignore`, no secrets in code, no dead buttons, no fake test results.

## Gotchas learned in this codebase
- React Compiler lint (react-hooks v7) is ON: no ref reads/writes during render, no `Date.now()` in render (use lazy `useState`), no synchronous `setState` in effects — fetch in effects and set state in the `.then` callback; timers/auto-submit run inside interval callbacks.
- Every `grid` needs an explicit `grid-cols-1` (minmax(0,1fr)) or long `truncate`/nowrap text widens the implicit column and overflows at 360px.
- Mongoose 9 filter types are strict: use `as const` for literal statuses in reusable filter objects.
- Zod 4 skips object `superRefine` when a field already failed — pass `{ when }` for cross-field checks (see `modules/auth/validation.ts`).
- Public catalog cache (`src/lib/cache/*`, `unstable_cache`) is invalidated with `revalidateTag(tag, { expire: 0 })` in route handlers (never "max": admins need immediate effect). Never cache personal/attempt data.
- Scripts that import `server-only` modules run with `node --conditions=react-server --import tsx` (see package.json).
- E2E harness must spawn child processes asynchronously (spawnSync stalls the in-memory mongod pipes).

## Commands
`pnpm dev | build | lint | typecheck | test | test:e2e (needs pnpm build) | check`
Every phase: typecheck → lint → test → build → e2e → update `docs/PROGRESS.md` with commands + real results.

## Safety
No `git push`, no paid services, no production DB writes, no destructive scripts without explicit confirmation flags.
