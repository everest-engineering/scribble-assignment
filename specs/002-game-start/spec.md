# Feature Spec: Game Start & Drawer Flow (Scenario 2)

## Overview

When the host starts the game, assign the drawer role, select a deterministic secret word, and expose the word only to the drawer via viewer-specific room snapshots. Validate player names on create and join.

## User Stories

### US-1: Player name validation
**As** a player creating or joining a room, **I want** my name trimmed and validated, **so that** empty names are rejected with a clear message.

**Acceptance Criteria:**
- [ ] Player names are trimmed before submission
- [ ] Empty or whitespace-only names rejected with "Player name is required"
- [ ] Valid names stored as trimmed value
- [ ] Validation on both create and join forms (frontend) and API (backend)

### US-2: Drawer assignment on game start
**As** a player in a starting game, **I want** the host clearly identified as the drawer, **so that** everyone knows who is drawing.

**Acceptance Criteria:**
- [ ] On start, `drawerId` set to host's participantId (host is first drawer)
- [ ] Room snapshot includes `drawerId` visible to all players
- [ ] Game UI identifies the drawer by name/role label
- [ ] Each participant snapshot includes their `role` ("drawer" or "guesser")

### US-3: Deterministic secret word selection
**As** the system, **I want** the secret word chosen deterministically from the starter list, **so that** all polls return the same word.

**Acceptance Criteria:**
- [ ] Word selected from STARTER_WORDS using deterministic index derived from room code
- [ ] Same room code always yields same word
- [ ] Word stored on room as `secretWord` (server-side only, not in public snapshot)

### US-4: Drawer-only word visibility
**As** the drawer, **I want** to see the secret word; **as** a guesser, **I want** it hidden.

**Acceptance Criteria:**
- [ ] `GET /rooms/:code?participantId=X` includes `secretWord` field only when X is the drawer
- [ ] Guessers receive snapshot without `secretWord` (or null/undefined)
- [ ] Drawer UI shows the secret word prominently
- [ ] Guesser UI shows no secret word

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Name with leading/trailing spaces " Alice " | Trimmed to "Alice" |
| Name with only spaces | Rejected |
| Poll as drawer vs guesser | Different snapshot fields |
| Re-start not in scope yet | Phase 4 handles restart word re-selection |

## API Changes

### Extended Room (server-side)
```typescript
{
  drawerId: string;
  secretWord: string;
  scores: Record<string, number>;  // participantId -> score, init 0
}
```

### Extended RoomSnapshot (viewer-specific)
```typescript
{
  drawerId: string;
  secretWord?: string;  // only for drawer viewer
  participants: Array<Participant & { role: ParticipantRole; score: number }>;
}
```

## Out of Scope (This Phase)

- Drawing canvas interaction (Phase 3)
- Guess submission (Phase 3)
- Result/restart (Phase 4)

## Validation Strategy

1. Try create/join with empty name → see error
2. Start game with 2 players → host shown as drawer
3. Drawer tab sees secret word; guesser tab does not
4. Same room code always gets same word (verify via backend test)
