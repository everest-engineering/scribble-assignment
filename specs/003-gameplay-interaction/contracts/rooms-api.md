# Contract: Rooms REST API (Scenario 3)

Base URL: `http://localhost:3001`. JSON over HTTP. No auth. **Bold** marks additions for this
feature. Builds on the Scenario 1–2 contract.

## Shared shape: RoomSnapshot (extended)

```jsonc
{
  // ...Scenario 1–2 fields: status, participants, hostId, isHost, canStart,
  //    drawerId, isDrawer, secretWord (drawer-only)...
  "guesses": [                       // NEW — per-viewer guess history
    {
      "id": "uuid",
      "participantId": "uuid-bob",
      "participantName": "Bob",
      "correct": false,
      "text": "rocket",              // shown (incorrect guesses are always visible)
      "createdAt": "..."
    },
    {
      "id": "uuid",
      "participantId": "uuid-carol",
      "participantName": "Carol",
      "correct": true,
      "text": null,                  // WITHHELD from other guessers when correct
      "createdAt": "..."
    }
  ],
  "scores": [                        // NEW — every participant's round score
    { "participantId": "uuid-host", "name": "Alice", "score": 0 },
    { "participantId": "uuid-bob",  "name": "Bob",   "score": 0 },
    { "participantId": "uuid-carol","name": "Carol", "score": 100 }
  ],
  "drawing": "data:image/png;base64,iVBORw0KGgo..."  // NEW (2026-06-05) — current drawing, or null
}
```

- `drawing` is the drawer's current canvas image, visible to **all** viewers (drawer and
  guessers). It is `null` when the canvas is empty or cleared.

- A correct guess's `text` is `null` for every viewer **except** the drawer and the guess's own
  author. Incorrect guesses always include `text`.

## POST /rooms/:code/guess — submit a guess (NEW)

Submits a guess for the active round. Guessers only.

Request:
```json
{ "participantId": "uuid-bob", "text": "  CASTLE " }
```
- `participantId` required (the guesser).
- `text` required, **trimmed, min length 1**.

Behavior:
- Trims `text`; compares `text.trim().toLowerCase()` to `secretWord.trim().toLowerCase()`.
- Records a `Guess` (author, `correct`, text, order).
- If correct and the guesser's score `< 100`, sets it to `100`; otherwise no score change.

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Valid guess recorded | `{ "room": { /* snapshot for this viewer */ } }` |
| `400` | Empty / whitespace-only `text`, or missing `participantId` | `{ "message": "Invalid request payload" }` |
| `403` | Requester is the drawer, or not a participant of the room | `{ "message": "Only guessers can submit guesses" }` |
| `404` | No active room for code | `{ "message": "Room not found" }` |
| `409` | Room is not in an active round (`status != "playing"`) | `{ "message": "The round is not active" }` |

## PUT /rooms/:code/drawing — update the drawing (NEW, 2026-06-05)

Stores the drawer's current canvas image so guessers can see it via polling. Drawer only.

Request:
```json
{ "participantId": "uuid-host", "drawing": "data:image/png;base64,iVBORw0KGgo..." }
```
- `participantId` required (must be the drawer).
- `drawing` required: a string (serialized canvas image) or `null` to clear.

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Drawer updates the drawing in an active round | `{ "room": { /* snapshot for the drawer */ } }` |
| `400` | Missing `participantId`, or `drawing` is neither string nor null | `{ "message": "Invalid request payload" }` |
| `403` | Requester is not the drawer | `{ "message": "Only the drawer can update the drawing" }` |
| `404` | No active room for code | `{ "message": "Room not found" }` |
| `409` | Room is not in an active round (`status != "playing"`) | `{ "message": "The round is not active" }` |

- The drawer's client calls this on a ~2s cadence while drawing, and immediately on Clear (with
  `drawing: null`). Last write wins.

## GET /rooms/:code — fetch snapshot (now carries guesses + scores + drawing)

Query: `participantId` (expected, so per-viewer history stripping and roles are correct).

Responses:
| Status | When | Body |
|--------|------|------|
| `200` | Room exists | `{ "room": { /* snapshot incl. guesses + scores for this viewer */ } }` |
| `404` | Unknown code | `{ "message": "Room not found" }` |

- Polled every ~2s by the game view; this is how guess history and scores sync to all players.
- The drawer's snapshot includes correct-guess text; guessers' snapshots have other players'
  correct-guess text as `null`.

## Determinism, secrecy & isolation guarantees

- Scoring is exact and capped: a guesser's score is `0` or `100`; repeat correct guesses never
  exceed `100`.
- The secret word never appears in a non-drawer's snapshot — neither in `secretWord` (Scenario 2)
  nor via a correct guess's `text` (this scenario).
- Guess history and scores are built solely from the addressed room's `Map` entry; no cross-room
  leakage. Drawing strokes are client-only and never transmitted.
