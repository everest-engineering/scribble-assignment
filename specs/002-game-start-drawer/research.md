# Research: Game Start & Drawer Flow

## Technical Context Unknowns

No major unknowns were identified. The application follows an Express + React structure with in-memory state.

## Decisions

- **Name Trimming**: Handled via Zod schemas (`.trim().min(1)`) on the backend for both `createRoom` and `joinRoom` payloads to guarantee backend integrity. The frontend can also enforce this, but the backend is the source of truth.
- **Drawer Assignment**: The room's `hostParticipantId` will automatically be designated as the `drawerId` within the `RoundState` object upon game start.
- **Word Selection**: The first word from the `STARTER_WORDS` array will be selected deterministically for the first round.
- **Secret Word Visibility**: The `toRoomSnapshot` mapping function will conditionally include the `secretWord` inside the returned snapshot's `roundState` only if the requesting `participantId` matches the `drawerId`. For guessers, this property will be omitted.
