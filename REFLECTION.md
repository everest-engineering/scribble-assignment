# Reflection Report

## What the Starter App Already Had

The starter was a scaffold with working infrastructure but no product logic:

- Monorepo structure: `backend/`, `frontend/`, `shared/schemas/` directories wired together with TypeScript path aliases
- A bare Express server with no meaningful routes
- A React frontend with file-based routing configured but only placeholder pages (`StartPage`, an empty `GamePage`)
- Empty or near-empty `roomStore.ts` and `api.ts` files — just module stubs
- No Zod schemas beyond a skeleton `index.ts`
- Vitest configured in both packages with seed tests confirming the test runner worked
- GitHub Actions CI/CD workflows for build and test checks
- A `CLAUDE.md` pointing at the feature spec for this lab

The app could not create a room, join a room, draw, or guess anything. It was a working shell.

---

## What Was Added

### Feature 001 — Room Setup & Lobby Navigation

- Backend `roomStore.ts`: `createRoom`, `joinRoom`, `getRoom` service functions
- API routes: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`
- Frontend pages: `CreateRoomPage`, `JoinRoomPage`, `LobbyPage` with forms, validation, error handling, and polling to detect game start
- Shared Zod schemas: `roomSnapshotSchema`, `roomSessionResponseSchema`, `roomResponseSchema`
- Full Vitest coverage for routes, services, and page components

### Feature 002 — Game Start & Drawer Flow

- Backend `startRoom`: host-only guard, 2-player minimum, drawer assignment, word selection
- `POST /rooms/:code/start` route
- Frontend: "Start Game" button on `LobbyPage` (host-only, disabled states), navigation to `/game` on status change
- TDD coverage for host guards, status transitions, drawer assignment

### Feature 003 — Gameplay Interaction

- Backend: `updateCanvas`, `clearCanvas`, `submitGuess`, `checkRoundExpiry` service functions
- Routes: `PUT /rooms/:code/canvas`, `DELETE /rooms/:code/canvas`, `POST /rooms/:code/guesses`
- Extended `Room` model: `canvasDataUrl`, `guesses`, `scores`, `correctGuessers`, `roundStartedAt`
- Deterministic scoring: 100 pts for correct guess, automatic round termination on timer or all-correct
- Frontend components: `DrawingCanvas` (freehand, clear, read-only mode), `GuessForm`, `Scoreboard`, `ResultPanel`, `PageErrorBoundary`
- `GamePage` wired with polling and full layout

### Feature 004 — Result, Restart & Final Validation

- Backend: `checkResultExpiry`, `restartRoom` service functions; `resultExpiresAt` on `Room`
- Drawer scoring: 50 pts per correct guesser, calculated at round-end
- Word reveal for all players when status is `"finished"`
- `POST /rooms/:code/restart` route
- Frontend `ResultsScreen`: word reveal, score table, chronological guess history with correct-guess highlighting, 30-second countdown with `aria-live`, host-only "Return to Lobby" button
- `GamePage` polling extended through `"finished"` state with lobby navigation on restart
- Shared: `resultExpiresAt: z.string().nullable()` added to `roomSnapshotSchema`
- End state: 78 backend tests passing, 64 frontend tests passing

### Spec Artefacts

For each of the four features: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/api-contracts.md`, `tasks.md`, and a requirements checklist. A shared `memory/constitution.md` defined seven engineering principles followed across all slices.
