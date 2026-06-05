# API Contract: Rooms & Gameplay

Base URL: `http://localhost:3001`. All bodies/responses are JSON. Codes are uppercased
server-side. Errors use `{ "message": string }` with an appropriate status (the starter's
`HttpError` convention). Existing endpoints are extended; new endpoints are marked **NEW**.

## GET /health

→ `200 { "ok": true }` (unchanged).

## POST /rooms — create room

Request: `{ "playerName": string }` — trimmed; empty/whitespace-only → `400 { message }`.

→ `201 { "participantId": string, "room": RoomSnapshot }`
The creator is the host (`room.hostId === participantId`). `room.status === "lobby"`.

## POST /rooms/:code/join — join room

Request: `{ "playerName": string }` — trimmed, non-empty (FR-008).
Path `:code` — unknown/invalid → `404 { message }` (FR-004).

→ `200 { "participantId": string, "room": RoomSnapshot }`

## GET /rooms/:code?participantId=... — fetch snapshot (polled ~2s)

→ `200 { "room": RoomSnapshot }`
`room.word` is present **only** when `participantId === room.drawerId` (FR-011, R4); otherwise
`null` with `room.hasWord` indicating a round is active. Unknown code → `404 { message }`.

## POST /rooms/:code/start — start game **(NEW)**

Request: `{ "participantId": string }`
Guards: caller MUST be host (`participantId === hostId`) → else `403 { message }`;
`participants.length >= 2` → else `400 { message }` (FR-007).

→ `200 { "room": RoomSnapshot }` with `status: "active"`, a `drawerId` (the host), and a
deterministic `word` (visible only to the drawer). (FR-009, FR-010)

## POST /rooms/:code/guess — submit guess **(NEW)**

Request: `{ "participantId": string, "text": string }`
Validation: `text` trimmed; empty/whitespace-only → `400 { message }` (FR-014). Room must be
`active`.

→ `200 { "room": RoomSnapshot }`
The guess is appended to `room.guesses` (synced to all via polling, FR-016). If
`text.trim().toLowerCase() === word.toLowerCase()` the guess is `correct: true` and the author's
`score += 100`; otherwise `+0` (FR-015, FR-017). A correct guess transitions the room to
`status: "result"`.

## POST /rooms/:code/restart — restart to lobby **(NEW)**

Request: `{ "participantId": string }`
Guard: caller MUST be host → else `403 { message }` (FR-019).

→ `200 { "room": RoomSnapshot }` with `status: "lobby"`, `round` cleared, every
`participant.score` reset to 0, roster preserved (FR-020).

## RoomSnapshot shape

See [data-model.md](../data-model.md) → "RoomSnapshot". Key viewer-dependent rule: `word` is only
serialized for the drawer.

## Contract Test Checklist (for /speckit-tasks → tests)

- Create returns host = creator; status lobby.
- Join with empty/whitespace name → 400; unknown code → 404.
- Start by non-host → 403; start with <2 players → 400; start by host with ≥2 → active + drawer +
  word for drawer only.
- Guess empty/whitespace → 400; case/whitespace-insensitive correct guess → score 100 + result;
  wrong guess → +0; guess appears in history for all viewers.
- Restart by non-host → 403; restart by host → lobby, scores 0, roster preserved, round cleared.
- Two rooms: mutating one never changes the other's snapshot.
