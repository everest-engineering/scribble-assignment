# Research: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-03

## Summary

All technical unknowns resolved through codebase inspection. No external research required — the project is a brownfield TypeScript monorepo with established patterns. This feature builds directly on the data model and API shape established in feature 002.

---

## Decision 1: Canvas state representation

**Decision**: Store the canvas as a Base64 PNG data URL (`string | null`) on the `Room` in-memory model. `null` represents a cleared/empty canvas.

**Rationale**: The existing architecture has no WebSocket layer — all state flows through polling `GET /rooms/:code`. A data URL is a single serialisable string that travels in JSON without additional encoding steps. The canvas `<canvas>` element exposes `.toDataURL()` natively in the browser; `drawImage()` on an `<img>` element restores it. The approach is stateless on the receiver: each poll response is a full snapshot, not a diff.

**Alternatives considered**:
- Stroke array / command log (rejected — requires delta tracking and replay logic; more complex for no gain given the polling model already sends full state each cycle).
- Compressed binary (rejected — violates constitution Principle V bundle discipline; requires a decode library).

---

## Decision 2: Canvas update endpoint shape

**Decision**: `PUT /rooms/:code/canvas` with body `{ participantId, canvasDataUrl }` for draw updates; `DELETE /rooms/:code/canvas` with body `{ participantId }` for clear. Both return `204 No Content` on success.

**Rationale**: Separating draw and clear into distinct operations mirrors the spec requirements (FR-002 and FR-003 are independent capabilities). `PUT` is idempotent and appropriate for replacing canvas state. `DELETE` communicates intent clearly. `204` avoids a redundant body for write-only operations where the caller does not need updated state (the next poll delivers that).

**Alternatives considered**:
- Single `POST /rooms/:code/canvas` with `{ action: "draw" | "clear" }` (rejected — conflates two semantically distinct operations; harder to test independently).

---

## Decision 3: Guess submission — trimming and comparison location

**Decision**: Trimming (`text.trim()`) and case-insensitive comparison (`text.toLowerCase() === room.currentWord?.toLowerCase()`) both happen on the **backend** in `submitGuess()` in `roomStore.ts`. The trimmed text is stored in the `Guess` record; the original input is discarded.

**Rationale**: The spec (FR-007, FR-009) requires deterministic server-side validation. Performing these server-side prevents any client from bypassing them. Consistent with the existing `displayName()` trim pattern in `roomStore.ts:34`.

**Alternatives considered**:
- Frontend-only trim before sending (rejected — server must be authoritative for scoring correctness per FR-016).

---

## Decision 4: Round timer storage and expiry checking

**Decision**: Store `roundStartedAt: string` (ISO timestamp) and a constant `ROUND_DURATION_SECONDS = 90` in `backend/src/seed/starterData.ts`. Round expiry is checked **lazily** on every relevant request (canvas write, guess submit, room GET) — if `status === "in-progress" && now > roundStartedAt + duration`, transition `status` to `"finished"` atomically before processing the request.

**Rationale**: The polling architecture has no background timer process. Lazy expiry check on every mutating request is the simplest approach consistent with the in-memory, stateless-by-design constraint (Constitution Principle V). The fixed 90-second duration is a reasonable game default; it lives in `starterData.ts` alongside other seed constants.

**Alternatives considered**:
- `setInterval` background task on the server (rejected — introduces a background process with cleanup concerns; out of scope for this feature).
- Client-driven round end (rejected — server must be authoritative to prevent cheating).

---

## Decision 5: Round-ended status value

**Decision**: Add `"finished"` to the `RoomStatus` union (`"lobby" | "in-progress" | "finished"`). This is an additive change to the Zod schema and TypeScript union.

**Rationale**: Downstream code (GamePage, GuessForm, canvas) needs to distinguish "game has not started" (lobby) from "game in progress" (in-progress) from "round has ended" (finished). A boolean `roundEnded` flag alongside `status` would create two overlapping state sources. A single canonical `status` field is cleaner and consistent with the existing pattern.

**Alternatives considered**:
- Separate `roundEnded: boolean` field (rejected — redundant with status, creates inconsistency risk).
- Reuse `"lobby"` for ended state (rejected — semantically wrong, breaks existing lobby UI guards).

---

## Decision 6: Polling endpoint for gameplay state

**Decision**: Enrich the existing `GET /rooms/:code?participantId=<uuid>` snapshot with all gameplay state (canvas data URL, guesses, scores, round end time, `hasGuessedCorrectly` flag). No new read endpoint is needed.

**Rationale**: The existing `roomStore.fetchRoom()` in `frontend/src/state/roomStore.ts` already polls on a cycle and calls `setRoomSnapshot()`. Folding gameplay state into `RoomSnapshot` means the frontend's polling loop, error handling, and Zod validation all work without change. The frontend only needs to read the richer snapshot.

**Alternatives considered**:
- Separate `GET /rooms/:code/guesses` endpoint (rejected — requires a second parallel polling loop in the frontend; adds complexity for no benefit).
- `GET /rooms/:code/canvas` endpoint (rejected — same reason as above).

---

## Codebase Gap Analysis

| Area | Current State | Required Change |
|------|---------------|-----------------|
| `RoomStatus` | `"lobby" \| "in-progress"` | Add `"finished"` |
| `Room` model | No canvas/guess/score fields | Add `canvasDataUrl`, `guesses`, `scores`, `correctGuessers`, `roundStartedAt` |
| `RoomSnapshot` | No gameplay data | Add `canvasDataUrl`, `guesses`, `scores`, `roundEndsAt`, `hasGuessedCorrectly` |
| `shared/schemas/room.ts` | No gameplay Zod schemas | Add `GuessSnapshot` schema, extend `roomSnapshotSchema`, add `"finished"` to status |
| `roomStore.startRoom()` | Sets status + drawerId + word | Also initialize `scores`, `guesses`, `roundStartedAt`, `canvasDataUrl: null` |
| `roomStore.toRoomSnapshot()` | Returns basic fields | Include canvas, guesses (with names resolved), scores, roundEndsAt, hasGuessedCorrectly |
| `roomStore.ts` | No canvas or guess operations | Add `updateCanvas()`, `clearCanvas()`, `submitGuess()`, `checkRoundExpiry()` |
| `backend/src/api/rooms.ts` | No canvas/guess routes | Add `PUT /:code/canvas`, `DELETE /:code/canvas`, `POST /:code/guesses` |
| `backend/src/api/schemas.ts` | No canvas/guess request schemas | Add `updateCanvasSchema`, `clearCanvasSchema`, `submitGuessSchema` |
| `frontend/src/services/api.ts` | No canvas/guess calls | Add `updateCanvas()`, `clearCanvas()`, `submitGuess()` |
| `frontend/src/state/roomStore.ts` | No gameplay actions | Add `updateCanvas()`, `clearCanvas()`, `submitGuess()` |
| `frontend/src/pages/GamePage.tsx` | Canvas placeholder | Replace with `DrawingCanvas` component (drawer) or read-only view (guesser) |
| `frontend/src/components/GuessForm.tsx` | Stub (no submit logic) | Wire submit to `roomStore.submitGuess()`, disable on correct/drawer/ended |
| `frontend/src/components/Scoreboard.tsx` | Stub | Render scores from `room.scores` |
| `frontend/src/components/ResultPanel.tsx` | Stub | Render guess history with correct/incorrect labels, green for correct |
| New: `DrawingCanvas.tsx` | Does not exist | Freehand drawing component (pointer events), clear button, polling-driven read-only mode |
| Tests | No gameplay tests | TDD tests for all new backend logic; component tests for canvas/guess UI |
