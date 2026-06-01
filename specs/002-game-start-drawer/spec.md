# Feature 002 — Game Start & Drawer Flow

## User story

As players in a full lobby, we want the host to start the round so one drawer sees the secret word while others do not.

## Acceptance criteria

### Start transitions state

- **Given** a host with ≥2 players in `lobby`, **When** start succeeds, **Then** `status` becomes `playing`, roles are assigned, and a secret word is chosen.

### Drawer identification

- **Given** the round has started, **When** any client loads the game snapshot, **Then** the drawer participant is clearly marked (`isDrawer` / role label in UI).

### Deterministic word

- **Given** the same room code, **When** the first round starts, **Then** the secret word index is derived deterministically from the code (e.g. sum of char codes modulo word list length), using only `STARTER_WORDS`.

### Drawer-only word visibility

- **Given** the viewer is the drawer and status is `playing`, **When** they poll the room, **Then** `secretWord` is present in the JSON.
- **Given** the viewer is a guesser, **When** they poll, **Then** `secretWord` is omitted or null.

### Name trim (reinforced)

- **Given** whitespace-only names on create/join, **When** submitted, **Then** rejected with message (covered in 001, verified in game flow).

## Edge cases

- Starting with exactly two players assigns host as drawer.
- Re-starting the same room code in a new session after backend reset is out of scope; in-memory only.

## Out of scope

Drawer rotation, multiple rounds, random word packs, timers.
