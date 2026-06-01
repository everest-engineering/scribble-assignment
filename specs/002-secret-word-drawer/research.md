# Research: Secret Word Drawer

## 1. Stack and execution model

- Decision: Keep the existing Express backend, React frontend, Vite tooling,
  and Vitest test setup.
- Rationale: The starter already uses this stack and the constitution forbids
  changing it for this feature.
- Alternatives considered: Adding a new realtime layer, introducing a database,
  or replacing the current room store with a separate state service.

## 2. Round ownership

- Decision: Treat the first participant in the room as the host/drawer for the
  first round.
- Rationale: The current lobby flow already preserves participant order, so the
  first participant is a stable, minimal source of truth.
- Alternatives considered: Storing a separate host field, rotating the drawer,
  or picking a drawer at random.

## 3. Secret word storage and visibility

- Decision: Store the selected secret word in the active round state, but only
  include it in the snapshot returned to the drawer.
- Rationale: This keeps the server authoritative while preventing guessers
  from seeing the word through polling.
- Alternatives considered: Keeping the word only in frontend state, or exposing
  the full round payload to every viewer and hiding it in the UI.

## 4. Host-selected word choice

- Decision: Let the host choose a starter-list word at round start and store
  that selected value on the server.
- Rationale: The host is already the authoritative starter for the round, and
  using the shared starter list keeps the choice bounded and testable.
- Alternatives considered: Fully automatic selection, random selection, or
  hashing the room code to derive a word.

## 5. Input validation

- Decision: Trim player names at the API boundary and reject empty or
  whitespace-only values with clear validation errors.
- Rationale: The feature explicitly requires cleaned names before the round
  starts, and the current codebase already uses Zod for request validation.
- Alternatives considered: Cleaning names only in the UI or accepting blank
  values and normalizing them later.

## 6. HTTP-only room refresh

- Decision: Keep room state synchronized through HTTP requests only, using the
  existing participant-aware room snapshot flow.
- Rationale: The constitution forbids push transport, and viewer-specific
  polling is already the established pattern in the app.
- Alternatives considered: WebSockets, server-sent events, or local-only round
  state that would diverge across tabs.
