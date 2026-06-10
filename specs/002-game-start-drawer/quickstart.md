# Quickstart: Game Start & Drawer Flow

## Prerequisites

- Backend running: `cd backend && npm run dev` (port 3001)
- Frontend running: `cd frontend && npm run dev` (port 5173)
- Two browser tabs at `http://localhost:5173`
- Feature Group 1 (Room Setup & Lobby) fully implemented

## Scenario A — Drawer sees secret word, guesser does not

**Tab 1 (Alice / Host)**
1. Create Room, name `Alice`. Note the room code.
2. In the lobby, Alice sees "Host" next to her name.

**Tab 2 (Bob / Guest)**
3. Join Room, name `Bob`, enter Alice's code.
4. Lobby in Tab 2 shows both Alice and Bob.

**Tab 1 — Start the game**
5. Alice clicks Start (enabled, 2 players present).
6. Both tabs navigate to the game screen.

**Verify drawer vs. guesser view**
7. In Tab 1 (Alice / drawer): confirm "Drawer" role badge is visible and the secret word
   "rocket" is displayed.
8. In Tab 2 (Bob / guesser): confirm "Guesser" role badge is visible and NO secret word
   is shown.
9. In both tabs: confirm "Drawing" label appears next to Alice's name in the participant
   area or game header.

## Scenario B — Determinism: same word every time

1. Create a second room in a third tab with names `Carol` (host) and `Dan` (guest).
2. Start that game.
3. Confirm Carol (drawer) also sees "rocket" — confirming deterministic selection.

## Automated tests

```bash
cd backend && npm test
cd frontend && npm test
```

Tests to add: `startGame sets drawerId=hostId and secretWord=STARTER_WORDS[0]`,
`toRoomSnapshot returns secretWord only for drawer viewer`.
