# Research: Lobby & Host Management

## Player Name Validation

- **Decision**: Validate on both frontend (instant UX) and backend (authoritative).
  - Frontend: inline error messages under the input field using local React state.
  - Backend: Zod `z.string().trim().min(1, "Name is required").max(30, "Name must be 30 characters or less")`.
  - `preprocess` with `z.preprocess(val => typeof val === "string" ? val.trim() : val, ...)` to trim before validation.
  - Empty/whitespace-only → `ZodError` → error handler returns 400 with field-level message.
- **Rationale**: Frontend validation gives instant feedback; backend Zod schema is the single source of truth. Pattern matches existing `schemas.ts`.
- **Alternatives considered**: Backend-only validation (worse UX), custom validator function (duplicates Zod's built-in).

## Lobby Auto-Polling (HTTP)

- **Decision**: `useEffect` with `setInterval` (2s) in `LobbyPage` calling `roomStore.fetchRoom()`. Cleanup on unmount. Loading state shown as a subtle spinner/banner, not page flicker.
  - Use `useRef` to track mounted state to avoid setting state after unmount.
  - Skip navigation to `/` on fetch errors during polling (only log).
- **Rationale**: Polling fits the no-WebSockets constraint. 2s matches spec (FR-007). `useEffect` cleanup prevents leaks.
- **Alternatives considered**: `useSyncExternalStore` with interval in store (adds timing to state layer — separation of concerns violation), react-query (Constitution forbids new deps).

## Host Tracking & Transfer

- **Decision**: Add `hostId: string` field to `Room` model. Add `isHost: boolean` derived field to `RoomSnapshot` per-participant view (computed at snapshot time by comparing `participant.id === room.hostId`).
  - On `createRoom`: set `hostId` to the creator's participant ID.
  - On host leaving (when leave endpoint is implemented): transfer to earliest-joined remaining participant.
- **Rationale**: Storing `hostId` once on Room is cleaner than per-participant `isHost` flags (which would need updates on every leave). Deriving at snapshot time keeps the model normalized.
- **Alternatives considered**: `isHost: boolean` on each `Participant` (denormalized, harder to keep consistent).

## Host-Only Game Start

- **Decision**: New `POST /rooms/:code/start` endpoint.
  - Validates: room exists, caller is host (`participantId` in body matches `room.hostId`), >= 2 participants.
  - Sets `room.status = "playing"`, selects a random word from `STARTER_WORDS`, assigns roles (first participant = drawer, rest = guessers).
  - Returns updated `RoomSnapshot`.
  - Frontend: host sees enabled "Start Game" button; non-host sees nothing.
- **Rationale**: A dedicated start endpoint keeps the lobby read-model clean (GET does not mutate state). Host validation on the server is mandatory.
- **Alternatives considered**: Start via PATCH on room (less RESTful), start via query param on GET (side-effect in GET is bad practice).

## Room Cleanup on Empty

- **Decision**: After any participant leaves, if `room.participants.length === 0`, delete the room from the store.
- **Rationale**: Prevents memory leaks. Matches Constitution IV requirement. Since the leave endpoint is not yet built, this check goes in a future `leaveRoom` function.
- **Alternatives considered**: Periodic sweep (more complex, unnecessary for single-server).

## Frontend Error Display Pattern

- **Decision**: Use local `useState` for inline form errors. Clear on input change. Match existing form patterns in `CreateRoomPage.tsx` and `JoinRoomPage.tsx`.
  - For name: `error: string | null` shown as `<p className="error-message">{error}</p>` below the input.
  - For room code: same pattern.
- **Rationale**: Existing pages already have basic form structure. Adding error state is minimal. No toast/notification library needed.
- **Alternatives considered**: Global error state in `RoomStore` (too broad — form errors are per-field and ephemeral).

