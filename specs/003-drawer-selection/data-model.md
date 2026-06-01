# Data Model: Drawer Selection & Word Visibility

## Entities

- Player
  - `id: string` (client-generated UUID)
  - `displayName: string` (trimmed, non-empty)
  - `clientId: string` (transport client identifier)
  - `joinOrder: number` (0-based index)
  - `isHost: boolean`

- Room
  - `id: string` (room code)
  - `players: Player[]`
  - `seed: string` (deterministic seed used for word selection)
  - `starterWordList: string[]`
  - `roundIndex: number` (current round index)
  - `createdAt: ISODate`

- Round
  - `index: number`
  - `drawerPlayerId: string` (Player.id)
  - `secretWord?: string` (server-only, only resolvable by drawer)
  - `startedAt?: ISODate`

## Relationships

- A `Room` has many `Player`s.
- A `Room` has many `Round`s (conceptually); the current round is addressed by `roundIndex`.

## Validation Rules

- `Player.displayName` must be `trim()`'ed and non-empty; enforced on both client and server.
- `Room.starterWordList` must be non-empty to allow round start; otherwise start is rejected with a clear error.

## State Transitions (simplified)

1. Room creation: Room created with `seed` and `starterWordList`.
2. Players join: `players` array populated; `joinOrder` set by order of acceptance.
3. Start first round: server determines `drawerPlayerId` (host or first joinOrder), computes `secretWord` deterministically from `seed` and `roundIndex`, sets `startedAt`.
4. End round: server clears `secretWord` from accessible payloads and increments `roundIndex` as needed.
