# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See the root `../CLAUDE.md` for full project context.

## Next.js Version Warning

@AGENTS.md

This project uses **Next.js 16**, which has breaking changes from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. APIs, conventions, and file structure may differ from training data. Heed deprecation notices.

## Frontend-Specific Notes

- App Router only — no Pages Router
- TailwindCSS 4 is configured via PostCSS, not `tailwind.config.js`
- Path alias: `@/*` → `src/*`
- `src/services/api.ts` — Axios instance; set `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
- NextAuth session contains the Django JWT; access via `useSession()` or `getServerSession()`
