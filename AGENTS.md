# AGENTS.md

## Quick Reference

- **Package manager**: pnpm only (npm/yarn blocked by preinstall hook)
- **Node**: 24+, **pnpm**: 10+, **TypeScript**: 5.9
- **Typecheck**: `pnpm run typecheck` (runs libs via `tsc --build`, then all packages)
- **Build**: `pnpm run build` (typecheck + build)
- **Dev server**: `pnpm --filter @workspace/web3hackviz run dev` (port 5000)
- **API server**: `pnpm --filter @workspace/api-server run dev`
- **No ESLint** — Prettier only (no lint command defined)

## Monorepo Structure

```
hackviz/
├── lib/
│   ├── db/                 # Drizzle ORM + PostgreSQL schema
│   ├── api-spec/           # Orval codegen from OpenAPI spec (openapi.yaml)
│   ├── api-client-react/   # Generated React Query hooks + custom-fetch
│   └── api-zod/            # Generated Zod schemas
├── artifacts/
│   ├── web3hackviz/        # Main React app (Vite, React 19, Tailwind 4, shadcn/ui)
│   ├── api-server/         # Express 5 backend (esbuild bundle)
│   └── mockup-sandbox/     # Component sandbox
├── scripts/                # Utility scripts (tsx)
└── package.json            # Workspace root
```

## TypeScript

- Libs (`lib/*`): use `tsc --build` with project references (`composite: true`). Build order matters — `db` → `api-zod` → `api-client-react`.
- Artifacts: use `--noEmit`, no emit output.
- Root `tsconfig.json` orchestrates lib builds via `references`.
- Path alias: `@/` → `src/` (Vite) and `@assets/` → `attached_assets/` (only in web3hackviz).

## Codegen

API client and Zod schemas are generated from `lib/api-spec/openapi.yaml`:
```bash
pnpm --filter @workspace/api-spec run codegen
```
Generated files live in `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`. Do not edit these manually.

## Database

- Schema: `lib/db/src/schema/`
- Push schema to dev DB: `pnpm --filter @workspace/db run push`
- Requires `DATABASE_URL` env var
- `post-merge.sh` runs `pnpm install --frozen-lockfile && pnpm --filter db push`

## Key Conventions

- Shared dependency versions managed via **pnpm catalog** in `pnpm-workspace.yaml` — use `catalog:` in package.json deps.
- **Security**: `minimumReleaseAge: 1440` (1 day) enforced on npm packages.
- Adding a new hack: edit `artifacts/web3hackviz/src/data/hacks.ts` — see `ADDING_HACKS.md` for template.
- Vercel deploy builds with `BASE_PATH=/ PORT=3000`.
- `generated/` directories are gitignored.
