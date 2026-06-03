# Feature Group 2 — Game Start & Drawer Flow

Covers Business Scenario 2. Adds player-name validation, the start-game
transition, drawer assignment, deterministic secret-word selection, and
drawer-only word visibility.

## User scenario

> **Given** a game is starting and player names are trimmed (empty/whitespace-only
> rejected with a message), **When** the first round begins, **Then** the host
> (or first player) becomes the clearly-identified drawer, and the secret word
> (deterministically selected from the starter list) is visible only to the
> drawer.

## In scope

- Trim player names and reject empty/whitespace-only names with a clear message,
  on both create and join.
- A host-only "start game" action that moves the room from `lobby` to `playing`,
  requires ≥2 players, assigns the drawer, and selects the secret word.
- Drawer assignment: the host (the first/creating player) is the drawer.
- Deterministic secret-word selection from the starter word list.
- Word visibility: the secret word appears in a room snapshot only for the
  drawer; guessers never receive it.
- Clients react to the start: the drawer sees the word and is identified as the
  drawer; guessers are told who is drawing and transition into the game.

## Out of scope

Drawing/clear canvas, guessing, scoring (Group 3); result and restart (Group 4).
No multiple rounds, rotation, timers, or random word packs.

## Functional requirements

1. **Name validation.** `playerName` is trimmed; an empty or whitespace-only name
   is rejected with "Enter a player name." The client blocks submission and shows
   the message; the backend rejects it as a 4xx as a safety net. Stored names are
   the trimmed value.
2. **Start preconditions.** Starting requires: the requester is the host, the room
   is in `lobby`, and there are ≥2 participants. Otherwise the request is rejected
   with a specific message (not host → 403; too few players → 400).
3. **Status transition.** A successful start sets `status` to `playing`.
4. **Drawer assignment.** The drawer is the host (`drawerId = hostId`). The
   snapshot exposes `drawerId` so every client can identify the drawer.
5. **Deterministic word.** The secret word is chosen from the starter list by a
   pure function of the room code, so the same room always yields the same word
   and all clients agree without extra coordination.
6. **Word visibility.** `toRoomSnapshot` returns `word` set to the secret word
   only when the viewer is the drawer; for everyone else `word` is `null`.
7. **Client transition.** When the lobby snapshot shows `status === "playing"`,
   non-host players navigate into the game automatically; the host navigates on
   starting. The game screen shows the drawer's name, and shows the secret word
   only to the drawer.

## Acceptance criteria

- AC1: Creating or joining with a whitespace-only name shows "Enter a player
  name." and does not proceed; a name with surrounding spaces is stored trimmed.
- AC2: `POST /rooms/:code/start` by a non-host returns 403; by the host with only
  1 player returns 400; by the host with ≥2 players returns a `playing` snapshot.
- AC3: After start, the snapshot's `drawerId` equals `hostId`.
- AC4: The same room code always selects the same word; the word is one of the
  starter words.
- AC5: A snapshot fetched with the drawer's `participantId` includes `word`; a
  snapshot fetched by a guesser has `word === null`.
- AC6: After the host starts, a guesser's lobby (polling) moves to the game
  screen and sees the drawer's name but not the word.

## Edge cases

- Starting an already-`playing` room is rejected (not in `lobby`).
- A guesser cannot start the game even by calling the endpoint directly.
- Word selection never throws and always returns a starter word for any code.
