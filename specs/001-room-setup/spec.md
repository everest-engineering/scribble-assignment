# Feature Spec: Room Setup & Lobby (Scenario 1)

## Overview

Enhance the starter's room creation and lobby flow with host tracking, input validation, automatic polling, and host-only game start gated on minimum player count.

## User Stories

### US-1: Host is room creator
**As** a player who creates a room, **I want** to be automatically designated as the host, **so that** only I can start the game.

**Acceptance Criteria:**
- [ ] `POST /rooms` sets `hostId` to the creator's `participantId`
- [ ] Room snapshot includes `hostId` field visible to all participants
- [ ] Lobby UI identifies the host participant (badge or label)

### US-2: Join validation with clear feedback
**As** a player joining a room, **I want** invalid inputs rejected with clear messages, **so that** I know what went wrong.

**Acceptance Criteria:**
- [ ] Empty or whitespace-only room code rejected on frontend before API call with message "Room code is required"
- [ ] Room code must be exactly 4 characters (matching generated format); invalid format rejected with clear message
- [ ] Non-existent room code returns 404 with message "Room not found" (not generic error)
- [ ] Frontend displays API error messages to the user

### US-3: Room isolation
**As** multiple groups of players, **I want** rooms to be fully isolated, **so that** joining one room does not affect another.

**Acceptance Criteria:**
- [ ] Each room has a unique 4-character code
- [ ] Participants in room A are not visible in room B
- [ ] Creating/joining room A does not modify room B state

### US-4: Automatic lobby polling
**As** a player in the lobby, **I want** the participant list to update automatically, **so that** I see new players without clicking refresh.

**Acceptance Criteria:**
- [ ] Lobby polls `GET /rooms/:code?participantId=...` every ~2 seconds while on lobby page
- [ ] Polling stops when navigating away from lobby
- [ ] Manual refresh button still works as fallback
- [ ] New participants appear within ~2 seconds of joining

### US-5: Host-only start with minimum players
**As** the host, **I want** to start the game when at least 2 players are present, **so that** the game can begin.

**Acceptance Criteria:**
- [ ] Only the host sees an enabled "Start Game" button
- [ ] Non-host players see a waiting message instead of start button
- [ ] Start button disabled when fewer than 2 participants
- [ ] `POST /rooms/:code/start` validates: caller is host, room status is "lobby", ≥2 participants
- [ ] Non-host calling start returns 403 with clear message
- [ ] Successful start changes room status to "playing" and all polling clients detect the transition
- [ ] All clients navigate to game screen when status becomes "playing"

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Host leaves room | Out of scope for Phase 1; host remains in participant list |
| Duplicate join by same browser tab | Each join creates a new participant (no dedup in starter) |
| Backend restart | All rooms lost (in-memory); expected behavior |
| Poll during start transition | Client detects status change on next poll and navigates |
| Invalid room code format "AB" | Rejected before API call |
| Room code with lowercase "abcd" | Normalized to uppercase before lookup |

## Out of Scope (This Phase)

- Player name trim/validation (Phase 2)
- Drawer assignment and secret word (Phase 2)
- Drawing, guessing, scoring (Phase 3)
- Result and restart (Phase 4)

## API Changes

### Extended Room Snapshot
```typescript
{
  code: string;
  status: "lobby" | "playing" | "result";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

### New Endpoint
- `POST /rooms/:code/start` — body: `{ participantId: string }` — host-only start

## Validation Strategy

1. Tab 1: Create room → verify host badge shown
2. Tab 2: Join with valid code → verify appears in Tab 1 within ~2s without manual refresh
3. Tab 2: Verify no Start Game button (non-host)
4. Tab 1: Verify Start Game disabled with 1 player, enabled with 2
5. Tab 1: Click Start → both tabs navigate to game screen
6. Tab 3: Try joining invalid code "XY" → see error message
7. Create two separate rooms → verify isolation
