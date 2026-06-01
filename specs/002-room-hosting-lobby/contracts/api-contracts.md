# API Contracts: Room Hosting & Lobby

## POST /api/rooms

Create a new room.

Request

- Body: `{ "displayName": string }
`

Response 201

- Body: `{ "code": string, "room": Room }
`

Errors

- 400 Bad Request — invalid displayName

---

## POST /api/rooms/join

Join an existing room by code.

Request

- Body: `{ "code": string, "displayName": string }`

Response 200

- Body: `{ "room": Room }
`

Errors

- 400 Bad Request — empty/invalid code or displayName
- 404 Not Found — room not found
- 409 Conflict — room already in-game

---

## GET /api/rooms/:code

Get lobby view for a room (used by polling).

Response 200

- Body: `{ "room": Room }
`

Errors

- 404 Not Found — room not found

---

## POST /api/rooms/:code/start

Start the game for room `:code`. Requestor must be the host.

Request headers or body should include `playerId` (session-scoped) to authorize.

Response 200

- Body: `{ "room": Room }
`

Errors

- 403 Forbidden — requestor not host
- 409 Conflict — fewer than 2 players or already in-game

---

## Notes

- All request/response shapes must be validated server-side using Zod.
- Polling clients should call `GET /api/rooms/:code` every ~2s with jitter.
