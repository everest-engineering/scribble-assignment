# Research & Decisions

## 1. Deterministic Word Selection
**Decision**: Use a simple deterministic algorithm to select the word from a predefined static list (e.g., using the room ID character codes or just taking the first word in the list for the first round).
**Rationale**: The spec requires the word to be deterministically selected, meaning it should not rely on `Math.random()` in a way that is untestable. Using a simple index-based selection off the room properties ensures testability.
**Alternatives considered**: Pure randomness (violates spec).

## 2. Payload Security for Secret Word
**Decision**: The backend `RoomService` will scrub the `secretWord` from the room state before sending it to clients, unless the requesting client is identified as the Drawer.
**Rationale**: Fulfills FR-010 to prevent cheating by inspecting network payloads. Non-drawers will receive the word length and the drawer's name instead.
**Alternatives considered**: Hiding it only on the frontend (vulnerable to cheating).
