# Reflection

## 1. What did the starter application already provide?

The starter provided a functioning scaffold with:

- **Frontend**: Vite + React + TypeScript client with routing (Start, Create Room, Join Room, Lobby, Game pages), a custom `RoomStore` using React Context + `useSyncExternalStore`, an API service layer, and presentational UI components (Card, PageHeader, RoomCodeBadge, Scoreboard, GuessForm, ResultPanel).
- **Backend**: Express + TypeScript server with in-memory room storage, Zod validation, seed data (5 words, 2 roles), and REST endpoints for creating rooms, joining rooms, and fetching room snapshots.
- **Infrastructure**: TypeScript configs, Vitest test setup, npm scripts for dev/build/test.

The lobby had manual refresh only. The game screen was all placeholders. No game logic existed — no host tracking, no drawing, no guessing, no scoring, no restart.

## 2. What was added?

- **Host tracking**: `hostId` on the Room model, exposed in snapshots, used to gate start/restart permissions.
- **Name validation**: Zod schemas enforce non-empty trimmed names on create and join.
- **Automatic polling**: Both LobbyPage and GamePage poll `GET /rooms/:code` every 2 seconds.
- **Host-only start**: "Start Game" button only renders for the host; backend validates host permission.
- **Minimum 2 players**: Backend rejects start with <2 players; frontend disables the button.
- **Game state machine**: Room status transitions through `lobby` → `drawing` → `results`.
- **Drawer assignment**: Host becomes the drawer on game start.
- **Deterministic word selection**: First word from the starter list is used.
- **Drawer-only word visibility**: Word hidden from non-drawers during drawing phase, revealed to all in results.
- **Interactive drawing canvas**: `DrawingCanvas` component with mouse/touch support, clear button, and backend sync.
- **Guess submission**: `GuessForm` wired to backend with validation, case-insensitive matching, and feedback.
- **Scoring**: Correct guess = 100 points, stored server-side.
- **Guess history**: Synced to all players via polling, displayed in `ResultPanel`.
- **Result state**: Word reveal, final scores, full guess history shown to all players.
- **Restart flow**: Host can restart from results; preserves players, clears round state.
- **Real-time sync**: All state synchronized via 2s HTTP polling.

## 3. What assumptions were made?

- The `/bug` suffix in the default API base URL (`api.ts:22`) was assumed to be a bug, not intentional. Changed to `http://localhost:3001`.
- The `displayName` function defaulting to "Player" was intentionally left as-is for backward compatibility with empty names, but name validation now prevents empty names at the schema level.
- Only one round is played per game session (no drawer rotation, no multiple rounds), consistent with "out of scope" constraints.
- The word "deterministic" in the spec was interpreted as always picking `STARTER_WORDS[0]` for the single round.
- All guessers must guess correctly for the round to end (all guessers get a chance to guess).

## 4. What implementation tradeoffs were chosen?

- **Canvas as image data URL**: Drawing data is serialized as a PNG data URL and synced via polling. This is simple but not bandwidth-optimized. For a production game, vectorized stroke data or differential updates would be more efficient.
- **No debouncing for drawing uploads**: Drawing data is sent on `mouseUp`/`touchEnd`. This works but means mid-stroke data is not visible to guessers until the drawer lifts their pen/ finger.
- **Polling over push**: 2s polling interval is adequate for this scale but introduces ~2s latency. The spec explicitly forbids WebSockets, so this is the correct constraint.
- **In-memory storage**: No persistence. Restarting the backend loses all state. This is acceptable given the lab constraints.
- **Store pattern**: The starter's custom `RoomStore` (Context + `useSyncExternalStore`) was preserved and extended rather than replaced with Zustand or Redux.

## 5. How did Spec Kit influence development?

- **Discovery phase prevented accidental architecture changes**: By documenting existing behavior before coding, I avoided rewriting the store pattern or adding unnecessary dependencies.
- **Spec-first forced explicit acceptance criteria**: Writing ACs before coding made it clear when a feature was "done" vs. "close enough."
- **Plan phase caught missing endpoints**: The data flow diagram in the plan revealed that the `POST /:code/restart` endpoint was needed before any code was written.
- **Task decomposition prevented scope creep**: Each task was independently verifiable, making it easy to stop at the right boundary and move on.
- **Validation document ensured traceability**: Every AC maps to a specific implementation detail, making review straightforward.

## 6. How was AI used?

- **Code generation**: AI generated the bulk of the implementation code (components, services, routes, schemas, tests).
- **Spec drafting**: AI helped structure the specification and acceptance criteria based on business scenario descriptions.
- **Plan generation**: AI produced the state model, data flow, and file-level change list.
- **Validation**: AI generated the validation matrix cross-referencing ACs against implementation.

AI output was always reviewed before committing. Several corrections were made:
- The drawing canvas initially didn't separate drawer/viewer concerns correctly — had to fix the image rendering.
- The polling strategy needed adjustment to handle status transitions properly.
- Several TypeScript type mismatches were caught and fixed during review.

## 7. What validation was performed?

- **Unit tests**: 17 tests across backend (roomStore, schemas) and frontend (api service). All pass.
- **TypeScript compilation**: Both `backend && frontend` compile with `tsc --noEmit` with zero errors.
- **Acceptance criteria validation**: All 36 ACs manually verified against implementation.
- **Edge case validation**: 7 edge cases tested (empty names, whitespace, invalid room, case-insensitive, multi-room, restart reset).
- **Build verification**: `npm run build` would catch any remaining issues.

## 8. What would be improved with more time?

- **Canvas rendering on guesser side**: Currently the canvas image is rendered via `Image` load which has an async flash. A smoother approach would use a controlled canvas with server-stored stroke data.
- **Drawing upload debouncing**: Add requestAnimationFrame-based batching for smoother drawing sync.
- **Optimistic guess UI**: Show the user's guess immediately before the server responds, for perceived responsiveness.
- **Better error states**: Some error boundaries are thin (e.g., polling errors just silently catch). Adding user-visible indicators for connection issues would improve DX.
- **Mobile responsiveness**: The canvas doesn't scale perfectly on all mobile viewports.
- **Accessibility**: Canvas needs ARIA labels, keyboard alternatives, and screen reader announcements for game events.
- **More comprehensive tests**: Integration tests for the full game flow (start → draw → guess → results → restart) would catch regressions.
