# OpenCode Agent Instructions for Scribble

## Project

Monorepo: Express backend + React frontend, all TypeScript ESM. Multiplayer drawing game ("Scribble"). HTTP polling only — no WebSockets, no database, no auth.

## Commands

| Package | Dev | Build | Test |
|---------|-----|-------|------|
| `backend/` | `npm run dev` (tsx watch) | `npm run build` (tsc) | `npm test` (vitest) |
| `frontend/` | `npm run dev` (vite) | `npm run build` (tsc -b && vite build) | `npm test` (vitest) |

Backend: port 3001 (override via `PORT`). Frontend: port 5173. Node 18+ (see `.nvmrc`).

## Architecture

- **Entrypoints**: `backend/src/server.ts` → `app.ts` → `api/`; `frontend/src/main.tsx` → `App.tsx` → `routes/index.tsx`
- **State**: Custom `RoomStore` class via Context + `useSyncExternalStore` (not Zustand)
- **Backend routes**: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code?participantId=`
- **Room codes**: 4 chars, `^[A-Z2-9]{4}$` (excludes 0,1,I,O)
- **Seed data**: 5 words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`), 2 roles (`drawer`, `guesser`)
- **localStorage keys**: `scribble:lastRoomCode`, `scribble:participant:{code}`
- **Frontend API base**: `VITE_API_URL` env var (default `http://localhost:3001`)

## Backend Quirks

- `"module": "NodeNext"` + `"type": "module"`: all relative imports MUST use `.js` extension (e.g., `import x from "./foo.js"`)
- Use Zod (`z.object`) for request validation. Throw `HttpError` for structured error responses.
- All data in-memory (`Map<string, Room>`). Rooms vanish on restart.

## Testing

- Vitest across both packages. Backend tests live in `src/**/*.test.ts`, frontend in `src/**/*.test.{ts,tsx}` (jsdom).
- Frontend tests use `@testing-library/react`. API/service tests stub `global.fetch`.
- CI runs `npm ci → npm run build → npm test` independently per package.
- Verify both builds and test suites pass before committing.

## Lab Context

Brownfield lab with Spec Kit workflow. Artifacts in `specs/` and `.specify/`. Use `speckit.*` naming for constitution, specify, plan, tasks. See `README.md` for full lab workflow and acceptance criteria.
