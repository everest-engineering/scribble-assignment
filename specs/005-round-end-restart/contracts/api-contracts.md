# API Contracts — Round End Restart

## GET /rooms/:code/last-round-summary

Response 200
{
"roundId": "string",
"correctWord": "string",
"finalScores": [{ "playerId": "string", "score": 0 }],
"guessHistory": [{ "playerId": "string", "guess": "string", "correct": true, "timestamp": "ISO-8601" }],
"drawerId": "string"
}

## POST /rooms/:code/restart

Request: none (or optional reason)
Response 200
{
"status": "ok",
"room": { "code": "string", "players": [{ "id":"string","name":"string","score":0 }] }
}

Notes:

- Endpoints should be implemented on the backend and validated with Zod schemas.
- Clients poll for updates; no WebSocket push is used.
