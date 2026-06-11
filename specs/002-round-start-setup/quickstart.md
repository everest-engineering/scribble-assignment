# Quickstart: Round Start Setup

## Prerequisites

- Install backend dependencies with `cd backend && npm install` if needed.
- Install frontend dependencies with `cd frontend && npm install` if needed.
- Complete or include the room lobby flow needed to create, join, and start a
  room.

## Run Locally

1. Start the backend:

   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend in a second terminal:

   ```bash
   cd frontend
   npm run dev
   ```

3. Open the frontend in a browser at `http://localhost:5173`.

## Manual Validation Flow

1. Create a room with a player name that includes leading and trailing spaces.
2. Confirm the lobby and game views show the trimmed player name only.
3. Attempt to create a room with an empty or whitespace-only player name.
4. Confirm the action is rejected with clear player-name-required feedback.
5. In a second browser session, join the same room with a valid player name.
6. Start the game from the allowed Host flow.
7. Confirm the first round begins with exactly one drawer.
8. Confirm the Host is marked as drawer when eligible.
9. Confirm all players see the assigned drawer clearly marked.
10. Confirm the drawer sees the first starter word.
11. Confirm the non-drawer sees a blank or waiting state and does not receive or
    display the secret word.
12. Refresh or poll both clients and confirm the drawer marker and word
    visibility remain consistent.

## Fallback Drawer Check

1. Use a test setup where the Host is not eligible when first-round setup runs.
2. Start the first round.
3. Confirm the first eligible player by stable join order is assigned as drawer.
4. Confirm all players see that drawer marked and only that drawer receives the
   secret word.

## Error-State Checks

1. Attempt to create or join with whitespace-only names.
2. Confirm no participant is added and clear feedback appears.
3. Use a test setup with no eligible drawer.
4. Confirm first-round setup does not begin and clear feedback appears.
5. Use a test setup with an empty starter word list.
6. Confirm first-round setup does not begin and clear feedback appears.

## Automated Validation

Run focused tests after implementation:

```bash
cd backend
npm run test
npm run build
```

```bash
cd frontend
npm run test
npm run build
```
