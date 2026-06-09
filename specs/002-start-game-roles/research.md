# Research: Game Start & Role Assignment

## Overview

No unresolved NEEDS CLARIFICATION items remain in the spec (the one ambiguity about word selection was resolved via `/speckit.clarify`). All technical decisions are pre-defined by the constitution and existing codebase patterns. This document records the rationale for each architectural choice specific to this feature.

## Decisions

### Role Assignment Strategy

- **Decision**: Assign the drawer role by selecting a random participant index at game start. Store `drawerId` on the Room model. All other participants are guessers.
- **Rationale**: Random selection is simplest and ensures fairness. Storing `drawerId` as a participant UUID allows any participant to check their role by comparing against their own participantId.
- **Alternatives considered**: Round-robin assignment — overly complex for single-round. Host-designated drawer — contradicts spec's "system must assign" language.

### Word Selection Flow

- **Decision**: Two-phase flow — (1) on game start, system selects 3 random words from the word bank and stores them as `wordOptions` on the Room, visible only to the drawer; (2) drawer calls a dedicated `POST /rooms/:code/select-word` endpoint with their chosen word. The selected word is stored as `secretWord` and revealed to the drawer on subsequent polls.
- **Rationale**: Separation of concerns keeps the start endpoint focused on role assignment + state transition. The drawer has a deliberate action to confirm their word, preventing accidental reveals.
- **Alternatives considered**: Selecting the word as part of start — rejected because the drawer needs an explicit selection action. The word bank should live in a service module, not embedded in route handlers.

### Word Bank Implementation

- **Decision**: Hard-code a curated word list (100+ words) in a new `backend/src/services/wordBank.ts` module. Words are grouped by category (easy/medium/hard) for future difficulty filtering, but for v1 all words are drawn uniformly at random.
- **Rationale**: Simple, testable, no external dependencies. A dedicated module keeps the word bank isolated and easy to modify. 100+ words ensures sufficient variety for multiple rounds/games.
- **Alternatives considered**: Fetching from external API — adds latency and dependency. User-provided words — spec assumes predefined bank. File-based word list — harder to test.

### API-Level Word Protection

- **Decision**: The `GET /rooms/:code` response includes `wordOptions` and `secretWord` fields, but these are populated ONLY when the requesting `participantId` matches the `drawerId`. For all other participants, these fields are `null` or `undefined`.
- **Rationale**: Since the constitution forbids authentication, participantId-based filtering is the only feasible access control. The backend checks `drawerId === participantId` before populating word fields in the snapshot. A guesser cannot see the word even by calling the API directly, because they don't know the drawer's participantId.
- **Alternatives considered**: Omitting word fields entirely from the snapshot and using a separate endpoint — unnecessary complexity for the same security level.

### Game State After Start

- **Decision**: After `POST /rooms/:code/start`, the room transitions to `"in-progress"` with a sub-status of `"word-selection"`. After the drawer selects a word, the sub-status transitions to `"drawing"`. The frontend uses the sub-status to render the appropriate view.
- **Rationale**: The lobby → in-progress transition alone doesn't distinguish "drawer is picking a word" from "drawing is happening." A sub-status field enables clean view routing on the frontend without additional endpoints.
- **Alternatives considered**: Separate status values (`"in-progress"` and `"drawing"`) — simpler but loses the ability to show a "word selection" screen. Boolean `isWordSelected` flag — works but sub-status is cleaner for extensibility.
