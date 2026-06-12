# API Contracts — Game View Transition

Base URL: `http://localhost:3001` (configurable via `VITE_API_URL`)

This feature introduces **no new endpoints**. All contracts are unchanged from `specs/002-game-rounds/contracts/api.md`. The behavioural contract for the frontend is documented below.

---

## GET /rooms/:code — Get Room State (unchanged)

The existing endpoint already returns `status: "playing"` once the game starts. This is the signal the LobbyPage will use for redirect.

**Request:**

```
GET /rooms/:code?participantId=<participant-uuid>
```

**Response** (200) when status is `"playing"`:

```json
{
  "room": {
    "code": "AB12",
    "status": "playing",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "...", "isHost": true, "role": "drawer" },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "...", "isHost": false, "role": "guesser" }
    ],
    "hostId": "uuid-1",
    "availableWords": ["pizza"],
    "roles": ["drawer", "guesser"]
  }
}
```

The `word` field is included only for the drawer participant (per existing logic).

---

## POST /rooms/:code/join — Join Room (unchanged)

When a room is in `"playing"` status, the join endpoint returns `400` with `"Game already in progress"`.

The frontend `JoinRoomPage` already catches this error and displays it. No change needed.

**Error Response** (400):

```json
{
  "message": "Game already in progress"
}
```

---

## POST /rooms/:code/start — Start Game (unchanged)

Returns the room snapshot with `status: "playing"`. The host navigates to `/game` in the success handler. Other participants detect the status change via polling.

---

## Frontend Contract (new)

These are the behavioural contracts the frontend must satisfy:

| Condition | Behaviour |
|-----------|-----------|
| LobbyPage polls and `status === "playing"` | Navigate to `/game` |
| LobbyPage polls and `status === "finished"` | Navigate to `/` |
| GamePage loads with `status === "lobby"` | Navigate to `/lobby` |
| GamePage loads with `status === "finished"` | Show "Game has ended" message |
| Hard refresh on `/lobby` while `status === "playing"` | On first poll/fetch, redirect to `/game` |
| Direct nav to `/game` while `status === "lobby"` | Redirect to `/lobby` |
| Successful join of a room that becomes "playing" before next poll | Redirect to `/game` on next poll |
| Missing participant session (`room === null`) | Redirect to `/` (already implemented) |
