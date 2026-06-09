# Implementation Plan: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-05 | **Spec**: ../spec.md

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Implement the lobby setup flow for Scribble by extending the starter React frontend and Express backend. This work will wire room creation, room joining by code, host assignment, lobby polling, and host-only start-button enablement. Invalid and empty join codes are rejected clearly, room isolation is enforced, and host identity is preserved across browser refreshes via a local participant token.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Node.js 18+

**Primary Dependencies**: React, React Router v6, Vite, Express, Zod, Vitest

**Storage**: Server-side in-memory room store (Map<string, Room>)

**Testing**: Vitest for frontend and backend units; existing test scaffolds in `frontend/src/**/*.test.ts` and `backend/src/**/*.test.ts`

**Target Platform**: Web application (browser with local dev backend)

**Project Type**: Web application with separate `frontend/` and `backend/` packages

**Performance Goals**: Keep lobby polling lightweight; maintain bundle budget near 150KB for production client builds. Use caching of participant token and room snapshot updates to avoid unnecessary UI re-renders.
Measure production bundle precisely: run `npm run build` in `frontend/` and measure the gzipped size of the production JavaScript assets (main chunk + vendor as applicable). The primary threshold for this feature is a gzipped main JS bundle <= 150KB. T023 will automate this measurement and report exceedances with remediation steps.

**Constraints**: No WebSocket or real-time push mechanisms. No persistent database. No authentication service. Host persistence is session-local and token-backed, not a full auth flow.

**Scale/Scope**: Single-room lobby gameplay flow; supports multiple isolated rooms concurrently in memory; not yet implementing drawing, guessing, scoring, or restart logic.

## Constitution Check

- TypeScript strict mode and no silent `any` values must be maintained.
- Frontend UIs must use functional components and hooks only.
- Vitest coverage should cover new lobby logic at an 80% surface minimum.
- WCAG 2.1 AA accessibility should be considered for form validation, button states, and lobby updates.
- The implementation must not exceed the starter stack or introduce major new dependencies.
- Auto-commit hooks are enabled for completed feature implementation steps.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md
├── spec.md
├── checklists/
│   └── requirements.md
└── tasks.md (future)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   ├── router.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   └── services/
│       └── roomStore.ts
frontend/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Card.tsx
│   │   ├── PageHeader.tsx
│   │   ├── RoomCodeBadge.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── CreateRoomPage.tsx
│   │   ├── JoinRoomPage.tsx
│   │   ├── LobbyPage.tsx
│   │   ├── GamePage.tsx
│   │   └── ...
│   ├── routes/
│   │   └── index.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── api.test.ts
│   ├── state/
│   │   └── roomStore.ts
│   └── styles/
│       └── app.css
```

**Structure Decision**: The existing repository is a web application with separate backend and frontend packages. This feature will implement changes in `backend/src/api` and `backend/src/services`, and in `frontend/src/pages`, `frontend/src/state`, and `frontend/src/services`.

## Implementation Plan

### Phase 1 — Backend support for host-aware room snapshots

1. Extend the room model in `backend/src/models/game.ts` to include `hostParticipantId` or equivalent host metadata.
2. Update `backend/src/services/roomStore.ts`:
   - Set the host when creating a room.
   - Preserve host identity when additional participants join.
   - Continue to clone room state safely for API responses.
3. Update `backend/src/services/roomStore.ts.toRoomSnapshot` to include host identity in the snapshot or to mark the current viewer's host status when `viewerParticipantId` is provided.
4. Ensure `GET /rooms/:code` returns the room snapshot with participant data and host metadata.

### Phase 2 — Frontend session and lobby state handling

1. Extend `frontend/src/state/roomStore.ts` to persist `participantId` in `localStorage` so refresh preserves host identity.
2. Keep room snapshot state in the store and add error handling for fetch failures. On receiving a 404/`room_not_found` response the client MUST clear the stored `participantId` and surface a friendly message directing the user to re-join or create a new room.
3. Add room code and participant metadata to the store and ensure `fetchRoom()` uses the stored `participantId` query param.

### Phase 3 — Join/create form validation and error handling

1. Update `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx` to trim input values.
2. Validate that `playerName` is not empty and `roomCode` is not empty for join flow.
3. Show clear, accessible error messages for invalid or missing input.
4. Ensure the join page uppercases room codes consistently before submitting.

### Phase 4 — Lobby UX and polling

1. Update `frontend/src/pages/LobbyPage.tsx` to:
   - Display the host participant clearly in the participant list.
   - Show a host-only Start Game button.
   - Disable or hide start control for non-hosts.
   - Disable start control until there are at least 2 participants.
2. Implement polling with `setInterval` or a similar hook that re-fetches room state every 2 seconds while the lobby is mounted.
3. Keep the manual `Refresh Room` control as a fallback.
4. Ensure repeated room snapshots do not duplicate participants or cause flicker.

### Phase 5 — Host-only navigation guard

1. Prevent non-host players from proceeding to `/game` from the lobby.
2. If the host token is missing or mismatched, show an appropriate lobby state message rather than navigating.
3. Preserve the room state and participant token if the user refreshes the lobby page.

### Phase 6 — Testing and validation

1. Add/update backend tests in `backend/src/services/roomStore.test.ts` for:
   - host assignment on room creation
   - host identity preserved when a second player joins
   - `getRoom()` returning host-aware snapshots
   - join failure for unknown room codes
2. Add/update frontend tests in `frontend/src/services/api.test.ts` and page-level tests for:
   - create/join form validation
   - correct use of `participantId` in fetch requests
   - lobby polling behavior and host start enablement
   - disabled start controls for non-host users
3. Manual verification: two browser tabs create/join the same room, see lobby updates within 2 seconds, and verify only the host may start.

## Risks and Mitigations

- `participantId` persistence across refresh may create stale host state if a room is deleted. Mitigate by gracefully handling 404/invalid room responses and clearing stale storage.
- Lobby polling may generate unnecessary traffic if not throttled. Use a 2-second interval only while the lobby page is active and stop polling on unmount.
- Host metadata must remain consistent across room clones. Use `hostParticipantId` at the room model level rather than deriving host from participant order.

## Next Steps

- Create `specs/001-room-setup-lobby/tasks.md` with ordered implementation tasks.
- Implement backend host-aware room snapshots and frontend session persistence.
- Add vitest coverage for all new behavior.
