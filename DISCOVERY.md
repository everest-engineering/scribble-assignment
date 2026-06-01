# Project Findings

## Summary

This repository is a monorepo for the Scribble multiplayer drawing game. It contains
both the frontend web application (built with React and Vite) and the backend
REST API (built with Express and TypeScript). The two projects are developed
together in this workspace to simplify coordination between the client and server.

## Quick Facts

- **Repository:** Scribble (multiplayer drawing game)
- **Primary Languages:** TypeScript
- **Backend:** Express + Zod (in-memory)
- **Frontend:** React (Vite)
- **Realtime:** HTTP polling only (no WebSockets)

## Repo Structure

- `backend/` — Express API, in-memory room store, TypeScript
- `frontend/` — React app (Vite), pages and components
- `AGENTS.md`, `README.md`, `FINDINGS.md` — repo docs

## How to run (dev)

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Tests

- Unit tests use `vitest` in both `backend` and `frontend`.
- To run backend tests:

```bash
cd backend
npm test
```

## Key Files to Review

- Backend API: `backend/src/api` — routes and request schemas
- Room store logic: `backend/src/services/roomStore.ts`
- Frontend state: `frontend/src/state/roomStore.ts`
- Frontend pages: `frontend/src/pages/*` (Create/Join/Game)

## Observations / Notes

- Project follows TypeScript-first patterns and Zod validation on backend.
- No external database; data is in-memory and seeded from `seed/starterData.ts`.
- Real-time is intentionally avoided per project constraints (HTTP polling enforced).

## Known Bugs

- **Missing frontend environment config:** The frontend is missing an environment configuration for the API base URL, causing it to fall back to an incorrect default API URL (for example `/bug/rooms` instead of `/rooms`). Provide proper environment variables or configuration to set the correct API base URL.

## Risks & Recommendations

- Risk: In-memory store will not scale or persist across restarts — add clear disclaimers.
- Recommendation: Add developer docs for polling intervals and API contract examples.

## Next Steps / TODOs

1. Populate a high-level architecture diagram and flow.
2. Run tests and document failures or warnings.
3. Add example API requests and expected responses.

## Implementation Status

This section summarizes which UI pieces are scaffolded (present but non-functional) and which core gameplay features are not yet implemented. Use this as a quick checklist for feature completion and prioritization.

### Scaffolded (UI present, non-functional)

- Game screen — layout and placeholders for canvas, guess input, scoreboard, and results exist, but interactive behavior is not implemented.
- Canvas — styled element with static text; not an interactive drawing surface.
- Guess form — input and submit button render, but submission has no effect.
- Scoreboard and Result panel — display static/placeholder content only.
- Landing page copy — describes the intended game flow but does not reflect implemented features.

### Missing (not implemented)

- Host tracking — no concept of room owner or permissions to start the game.
- Player name validation — empty or invalid names silently default to "Player".
- Automatic lobby polling — only a manual refresh exists; no background syncing.
- Start-game flow — no backend endpoint, gating logic, or UI transition out of the lobby.
- Drawer assignment & secret word selection — seed data exists but runtime assignment is not implemented.
- Role-specific responses — viewers/players/drawers all see the same snapshot; no role-based views.
- Core gameplay mechanics — drawing interaction, guess handling, scoring, result state, and restart flow are not implemented.

### Impact

- Current state prevents completing a playable round; repository is primarily a UI scaffold with backend API skeletons.
- Prioritize: start-game flow, drawer assignment, and drawing/guessing mechanics for basic playability.

---

Document generated on: 31 May 2026
