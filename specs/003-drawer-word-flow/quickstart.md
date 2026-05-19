# Quickstart: Phase 2 Drawer Word Flow

## Prerequisites

- Install dependencies in both apps.
- Use branch `003-drawer-word-flow`.

## Start the backend

```bash
cd backend
npm run dev
```

Backend expected URL: `http://localhost:3001`

## Start the frontend

```bash
cd frontend
npm run dev
```

Frontend expected URL: `http://localhost:5173`

## Manual Validation Flow

### Story 1: Host starts and drawer is visible

1. Open the app in two browser sessions and create a room from the first session.
2. Join the same room from the second session.
3. Start the game as the host from the first session.
   Expected: both sessions enter `/game`, both show the same drawer identity, and
   the drawer is the host.
4. Confirm the non-host is treated as the guesser.
   Expected: the non-host view identifies the same drawer and does not present the
   viewer as drawer.

### Story 2: Deterministic word selection

1. Start a fresh two-player room.
   Expected: the drawer sees `rocket`.
2. Leave that room and create a second fresh two-player room.
   Expected: the drawer again sees `rocket`.
3. Confirm no other starter word is used during these fresh-room validations.

### Story 3: Secret word visible only to the drawer

1. In the started room, compare the drawer view and guesser view.
   Expected: the drawer sees the secret word; the guesser does not.
2. Refresh the game page in both sessions.
   Expected: the drawer still sees the same secret word and the guesser still does
   not see any secret-word field or value.
3. Fetch the room again through normal UI refresh behavior after start.
   Expected: drawer identity remains consistent for both players, and secrecy is
   preserved for the guesser.

### Isolation check

1. Create and start two different rooms in separate browser pairs.
   Expected: the drawer identity and secret word from room A never appear in room B,
   and vice versa.

## Build Validation

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run build
```
