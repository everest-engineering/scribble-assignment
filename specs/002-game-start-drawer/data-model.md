# Phase 1 Data Model: Game Start & Drawer Flow

In-memory only. Source of truth is `Map<string, Room>` in `backend/src/services/roomStore.ts`.
**Bold** marks fields added or changed by this feature.

## Type: RoomStatus

| Value | Meaning |
|-------|---------|
| `"lobby"` | Waiting room (Scenario 1). |
| **`"playing"`** | **An active round is in progress (drawer + secret word assigned).** |

## Entity: Room (backend internal)

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Unique, upper-case. |
| `status` | `RoomStatus` | **Now `"lobby" \| "playing"`.** |
| `participants` | `Participant[]` | Ordered; `[0]` is the host. |
| `hostId` | `string` | Creator (Scenario 1). |
| **`drawerId`** | **`string \| null`** | **NEW. The round's drawer; `null` in lobby. Set to `hostId` at start.** |
| **`secretWord`** | **`string \| null`** | **NEW. The round's word; `null` in lobby. Set at start, fixed for the round.** |
| `createdAt` | `string` (ISO) | Unchanged. |
| `updatedAt` | `string` (ISO) | Bumped on mutation (join, start). |

### Invariants

- `status === "lobby"` ⇒ `drawerId === null` and `secretWord === null`.
- `status === "playing"` ⇒ `drawerId === hostId` and `secretWord` is one of the starter words.
- Exactly one drawer per round (`drawerId` is a single id).
- `secretWord` does not change while `status === "playing"` (selected once at start).

## Entity: Participant

Unchanged shape (`id`, `name`, `joinedAt`). **Name is now trimmed and non-empty** at create/join.
Role is derived, not stored: `id === room.drawerId ? "drawer" : "guesser"`.

## Entity: RoomSnapshot (sent to clients)

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | |
| `status` | `RoomStatus` | `"lobby"` or `"playing"`. |
| `participants` | `Participant[]` | Trimmed names. |
| `availableWords` | `string[]` | Seeded list (unchanged). |
| `roles` | `ParticipantRole[]` | Seeded `["drawer","guesser"]` (unchanged). |
| `hostId` | `string` | Scenario 1. |
| `isHost` | `boolean` | Scenario 1. |
| `canStart` | `boolean` | Scenario 1 (`isHost && participants ≥ 2`). |
| **`drawerId`** | **`string \| null`** | **NEW. Who is drawing; `null` in lobby. Lets clients identify the drawer.** |
| **`isDrawer`** | **`boolean`** | **NEW. `viewerParticipantId === drawerId`.** |
| **`secretWord`** | **`string \| null`** | **NEW. The word **only** when `isDrawer`; otherwise `null` (stripped server-side).** |

## Derived values

| Value | Formula | Used by |
|-------|---------|---------|
| `isDrawer` | `viewerParticipantId != null && viewerParticipantId === room.drawerId` | Self-role, word visibility |
| `secretWord` (snapshot) | `isDrawer ? room.secretWord : null` | Drawer-only display |
| viewer role | `isDrawer ? "drawer" : "guesser"` | Game-view labels |
| word index (at start) | `sum(code.charCodeAt(i)) % availableWords.length` | Deterministic selection |

## State transitions

```text
lobby --start(host, ≥2 players)--> playing
   set drawerId = hostId
   set secretWord = availableWords[ deterministic index from code ]
   set status = "playing"

playing --(no transitions in Scenario 2)-->
   (restart back to lobby + clearing drawerId/secretWord is Scenario 4)
```

Start is rejected (no transition) when the requester is not the host or fewer than two
participants are present.
