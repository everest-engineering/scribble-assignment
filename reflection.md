# Reflection: Scribble Full Game Implementation

## Overview

Implementation of all 4 game scenarios for the Scribble multiplayer drawing game
on the `feat/scribble-lab` branch. The work focused on extending the existing
starter scaffold without adding out-of-scope features.

## What Was Implemented

- **Scenario 1 — Room Setup & Lobby**: Fixed hostId tracking, added Zod
  validation for room codes and player names, implemented auto-polling at 2s
  intervals, host-only start game with minimum 2-player gate, context-aware
  status messages.
- **Scenario 2 — Game Start & Drawer Flow**: Deterministic drawer assignment and
  word selection (based on room code character hash), role-based secret word
  visibility, lobby-to-game navigation on poll.
- **Scenario 3 — Gameplay Interaction**: HTML5 Canvas drawing with pointer
  capture, stroke persistence via HTTP, guess submission with trimming and
  case-insensitive comparison, 100-point scoring, guess history synced via
  polling.
- **Scenario 4 — Results & Restart**: Results view with correct word, scores,
  and guess history; round end via drawer action or all-correct detection;
  host-only restart preserving participants and clearing round state.

## Bug Fixes

1. `hostId` not assigned in `createRoom()` — the Room interface declared it but
   the constructor omitted it.
2. `hostId` missing from `toRoomSnapshot()` — the viewer parameter was ignored
   with `void viewerParticipantId`.
3. `API_BASE_URL` had `/bug` suffix in the default fallback, causing all
   unconfigured environments to hit non-existent routes.
4. `roomCodeParamsSchema.code` had no `.min(1)` — empty codes reached business
   logic.
5. `playerName` was `z.string().optional()` — empty names silently defaulted to
   `"Player"`.

## Key Decisions

- **Deterministic selection**: Drawer and word are selected using a hash of the
  room code (sum of character codes), guaranteeing the same room code always
  produces the same result.
- **Polling interval**: 2000ms aligns with the spec's ~2 second requirement.
- **Scoring**: Correct = +100, incorrect = 0, all scores initialized to 0.
- **Round end**: Triggers when the drawer clicks "End Round" OR all guessers
  have submitted a correct guess.
- **Drawing format**: Strokes stored as serializable point arrays to avoid
  binary image data in the REST API.

## Deviations from Spec

None — all acceptance criteria are met. The full validation flow works:
1. Two tabs join the same room
2. Host starts the game
3. Drawer sees the secret word
4. Drawing is shared across tabs
5. Guesses are synchronized
6. Scores are calculated correctly
7. Results are displayed when round ends
8. Restart returns everyone to the lobby

## Known Limitations

- Single-round games only (restart resets round to 0).
- No timer — rounds last until the drawer ends them or all guessers guess
  correctly.
- Maximum 5 unique words (from the starter word list).
- In-memory only — room state is lost on server restart.
