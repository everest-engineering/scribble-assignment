# Data Model: Room Hosting & Lobby

## Room

- `code: string` — unique human-friendly room code (6 chars)
- `hostId: string` — player id of host
- `players: Player[]` — list of players in join order
- `createdAt: string` — ISO timestamp
- `lastActiveAt: string` — ISO timestamp for GC
- `state: 'lobby' | 'in-game'`

## Player

- `id: string` — session-scoped ephemeral id
- `displayName: string`
- `joinedAt: string` — ISO timestamp
- `role: 'host' | 'player'`

## LobbyView

- `code: string`
- `players: {id:string, displayName:string, role:string}[]`
- `hostId: string`
- `state: string`

## Validation Rules

- `code` must be non-empty, match expected pattern (^[A-Z0-9]{6}$)
- `displayName` max length 32, non-empty
- `host` must be one of the players in the `players` list

## State Transitions

- `lobby` -> `in-game`: only allowed if `players.length >= 2` and requestor is `host`.
- `in-game`: joining is rejected; attempts return `409 Conflict`.

## TypeScript Types (suggested)

```ts
export type Player = {
  id: string;
  displayName: string;
  joinedAt: string;
  role: "host" | "player";
};

export type Room = {
  code: string;
  hostId: string;
  players: Player[];
  createdAt: string;
  lastActiveAt: string;
  state: "lobby" | "in-game";
};
```
