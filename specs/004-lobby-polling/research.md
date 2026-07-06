# Research: Automatic Lobby Polling

**Date**: 2026-07-06 | **Phase**: 0 (Outline & Research)

## Key Decisions

### Polling Mechanism: setInterval with useRef guard

- **Decision**: Use `setInterval` inside `useEffect` with a `useRef` flag to skip overlapping cycles.
- **Rationale**: Simplest approach that matches React patterns. The ref flag prevents sending a new request while one is in-flight (per FR-009). Cleanup in the useEffect return tears down the interval on unmount (per FR-002).
- **Alternatives considered**:
  - `setTimeout` recursive scheduling: More flexible but unnecessary for fixed 2s cadence.
  - `react-query` / `SWR`: Would add new dependency — violates brownfield constraint and constitution (no new top-level deps without justification).

### Navigation on Status Change: useNavigate

- **Decision**: Call `useNavigate()` to `/game` when poll response shows `status !== "lobby"`.
- **Rationale**: React Router v6 `useNavigate` is already used in LobbyPage for the "Start Game" button — consistent pattern.
- **Alternatives considered**:
  - `<Navigate>` component: Less idiomatic for imperative navigation triggered by side effect.

### 404 Handling: Navigate to Home

- **Decision**: On 404 from poll, call `navigate("/", { replace: true })` and surface error in roomStore.
- **Rationale**: Matches clarified behavior (SC-006). `replace: true` prevents back-button from returning to broken lobby.
- **Alternatives considered**:
  - Stay on lobby with error message: User would have no actionable path forward.

### Polling Location: LobbyPage component only

- **Decision**: Add polling logic directly in `LobbyPage.tsx` via `useEffect`.
- **Rationale**: Polling is scoped to lobby lifecycle — no other page needs this behavior. Colocating with the component is the simplest approach and avoids premature abstraction.
- **Alternatives considered**:
  - Custom hook `usePolling(fetch, interval)`: Cleaner but adds abstraction for a single-use pattern. Deferred to future refactor if polling is needed elsewhere.
  - RoomStore-level polling: Would couple store to timing concerns — violates separation of responsibilities.

## Existing Patterns Confirmed

- `RoomStore.fetchRoom()` already returns `RoomSnapshot` with `status` field — no changes needed.
- `RoomStore.setRoomSnapshot(room)` updates state immutably — poll results integrate cleanly.
- `useNavigate` from react-router-dom v6 is already imported and used in LobbyPage.
- LobbyPage already handles `isLoading` and `error` state from roomStore — poll will reuse same state.
