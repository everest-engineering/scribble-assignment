# API Contracts: Scribble Drawing Game

**Base URL**: `http://localhost:3001`
**Content-Type**: `application/json` (all requests and responses)

All error responses follow: `{ "message": "<description>" }`

---

## Existing Endpoints (unchanged behaviour, schema tightened)

### POST /rooms

Create a new room. Caller becomes host and first participant.

**Request**
```json
{ "playerName": "Alice" }
```
- `playerName`: required, non-empty after trim

**Response 201**
```json
{
  "participantId": "<uuid>",
  "room": { ...RoomSnapshot }
}
```

**Errors**: `400` — name empty or whitespace-only

---

### POST /rooms/:code/join

Join an existing room.

**Request**
```json
{ "playerName": "Bob" }
```
- `playerName`: required, non-empty after trim
- `code`: 4-char room code (case-insensitive; normalised to uppercase)

**Response 200**
```json
{
  "participantId": "<uuid>",
  "room": { ...RoomSnapshot }
}
```

**Errors**: `400` — name empty; `404` — room not found

---

### GET /rooms/:code?participantId=\<id\>

Fetch room snapshot. Used by polling and page loads.

- `participantId` query param determines secret-word visibility (drawer only during play)

**Response 200**
```json
{ "room": { ...RoomSnapshot } }
```

**Errors**: `404` — room not found

---

## New Endpoints

### POST /rooms/:code/start

Start the game. Host only. Requires ≥2 participants.

**Request**
```json
{ "participantId": "<host-uuid>" }
```

**Response 200**
```json
{ "room": { ...RoomSnapshot } }
```
- `room.status` will be `"playing"`
- `room.drawer` will be `participants[0].id`
- `room.secretWord` visible only to the requesting host if they are the drawer

**Errors**: `400` — fewer than 2 players; `403` — caller not host; `404` — room not found

---

### POST /rooms/:code/canvas

Update canvas data. Drawer only.

**Request**
```json
{
  "participantId": "<drawer-uuid>",
  "canvasData": "data:image/png;base64,..."
}
```
- `canvasData`: base64 PNG data URL string (empty string = canvas cleared)

**Response 200**
```json
{ "ok": true }
```

**Errors**: `403` — caller is not the drawer; `404` — room not found

---

### POST /rooms/:code/guess

Submit a guess. Guessers only.

**Request**
```json
{
  "participantId": "<guesser-uuid>",
  "text": "castle"
}
```
- `text`: trimmed before processing; rejected if empty after trim

**Response 200**
```json
{ "room": { ...RoomSnapshot } }
```
- Response snapshot includes updated `guesses` and `scores`

**Errors**: `400` — empty guess; `403` — caller is the drawer; `404` — room not found

---

### POST /rooms/:code/end

End the round and transition to result. Host only.

**Request**
```json
{ "participantId": "<host-uuid>" }
```

**Response 200**
```json
{ "room": { ...RoomSnapshot } }
```
- `room.status` will be `"result"`
- `room.secretWord` now visible to all participants in snapshot

**Errors**: `403` — caller not host; `404` — room not found

---

### POST /rooms/:code/restart

Reset to lobby with participants preserved. Host only.

**Request**
```json
{ "participantId": "<host-uuid>" }
```

**Response 200**
```json
{ "room": { ...RoomSnapshot } }
```
- `room.status` will be `"lobby"`
- `room.drawer`, `room.secretWord`, `room.canvasData` all absent
- `room.guesses` empty array
- `room.scores` empty object

**Errors**: `403` — caller not host; `404` — room not found

---

## RoomSnapshot Shape

```typescript
interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "result";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawer?: string;
  secretWord?: string;       // conditional — see visibility rules
  canvasData?: string;
  guesses: Guess[];
  scores: Record<string, number>;
}

interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  text: string;
  correct: boolean;
  timestamp: string;
}
```
