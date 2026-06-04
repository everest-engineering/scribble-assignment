# Research: Scenario 1 — Room Setup & Lobby

**Phase**: 0 — Technical Research

## Decisions

### Polling Strategy (FR-004)

| Decision | Value |
|----------|-------|
| **Chosen** | Fixed-interval `setInterval` at 2000ms |
| **Rationale** | Simplest approach; aligns with existing manual refresh pattern. No exponential backoff needed since lobby poll is lightweight (reads from in-memory Map, no DB). |
| **Alternatives considered** | Polling with jitter (unnecessary at this scale); Server-Sent Events (violates No WebSockets constraint); WebSocket (explicitly forbidden). |

### Host Tracking (FR-001)

| Decision | Value |
|----------|-------|
| **Chosen** | `hostId: string` field on `Room` model, set to creator's `participant.id` in `createRoom()`. |
| **Rationale** | Single field, no separate "host" entity needed. Client receives `hostId` in `RoomSnapshot` to conditionally render start-game UI. |
| **Alternatives considered** | `isHost` boolean on each Participant (data duplication); separate host role enum (over-engineered for v1). |

### Code Validation (FR-002)

| Decision | Value |
|----------|-------|
| **Chosen** | Zod `.min(1)` on `roomCodeParamsSchema.code` rejects empty/blank strings; backend returns 400. Empty-code requests never reach the store. |
| **Rationale** | Zod validation is already used; catching empty codes before service layer keeps validation centralized. |
| **Alternatives considered** | Client-only validation (can be bypassed); regex pattern validation (`.min(1)` is sufficient for v1 — format is already normalized uppercased). |

### Game Start Guard (FR-005, FR-006)

| Decision | Value |
|----------|-------|
| **Chosen** | New `POST /rooms/:code/start` endpoint checks (1) room exists, (2) requester is host, (3) at least 2 participants present. Returns 404/403/400 respectively. |
| **Rationale** | Single endpoint with layered validation. Client-side also hides/disables button for non-hosts and <2 players, but server is authoritative. |
| **Alternatives considered** | `PATCH /rooms/:code/status` (too generic — no validation layering); `POST /rooms/:code/start` with body (no body needed — endpoint is idempotent guard). |

### Error Messages for Invalid Codes (FR-002)

| Decision | Value |
|----------|-------|
| **Chosen** | Backend returns `400 { message: "Room code is required" }` for empty; `404 { message: "Unable to join room" }` for not-found. Frontend displays these verbatim. |
| **Rationale** | Differentiates "you didn't type anything" from "that room doesn't exist" — clear feedback per requirement. |
| **Alternatives considered** | Generic "Invalid code" (loses specificity); frontend-only empty check + backend generic error (duplicated logic). |

## Dependencies

- **Zod**: Already in `backend/package.json` — no install needed
- **Vitest**: Already configured in both projects — no install needed
- **React**: Already in `frontend/package.json` — no install needed

No new dependencies required.
