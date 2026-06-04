# Research: Game Start & Drawer Flow

## 1. Name trimming and empty-name rejection

- Decision: Keep name normalization at the API boundary with Zod `trim()` plus
  a non-empty validation rule on create/join payloads.
- Rationale: The backend remains the source of truth, and the same rule covers
  both browser and direct HTTP clients.
- Alternatives considered: Trimming only in the UI, or accepting blank names and
  patching them later. Both leave the backend inconsistent.

## 2. Deterministic secret-word selection

- Decision: Derive a stable index from `room.code` with a pure string hash, then
  modulo `STARTER_WORDS.length`.
- Rationale: The word must be reproducible for a room, testable, and different
  across rooms without any random dependency.
- Alternatives considered: `Math.random()` and "always first word". The first is
  nondeterministic; the second makes every room identical.

## 3. Drawer-specific room snapshots

- Decision: Serialize room state through a viewer-aware snapshot helper and
  omit `currentWord` entirely unless the viewer is the drawer.
- Rationale: The spec explicitly requires field omission, not `null`, for
  guessers.
- Alternatives considered: Return `currentWord: null` or hide it only in the UI.
  Both leak contract ambiguity and weaken the API guarantee.

## 4. Role storage

- Decision: Extend participant state with a `role` assigned when the game
  starts, with the host becoming `drawer` and everyone else `guesser`.
- Rationale: The UI needs to label each player and the backend needs a single
  source of truth for role-aware snapshots.
- Alternatives considered: Keep roles purely derived from host id. That is less
  explicit and makes future role display logic harder to reason about.

## 5. Host leaving mid-game

- Decision: Treat the drawer/host leaving during `game` status as an immediate
  room deletion.
- Rationale: The spec and constitution both exclude drawer rotation, so there is
  no valid fallback state.
- Alternatives considered: Promote another player or keep the room alive without
  a drawer. Both conflict with the feature spec.
