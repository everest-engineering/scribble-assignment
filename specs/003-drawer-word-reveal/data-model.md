# Data Model: Game Start — Drawer Assignment and Word Reveal

**Branch**: `003-drawer-word-reveal` | **Date**: 2026-05-30

## No Backend Model Changes

This feature requires **no changes to backend data models or API responses**. All information needed to derive the drawer identity and the secret word is already present in the existing `RoomSnapshot`.

---

## Derived State (Frontend Only)

The following values are computed on the frontend from the existing `RoomSnapshot`:

| Derived Value | Source | Computation |
|---------------|--------|-------------|
| `isDrawer`    | `room.hostId`, `participantId` | `participantId === room.hostId` |
| `secretWord`  | `room.availableWords` | `room.availableWords[0]` |
| `drawerName`  | `room.participants`, `room.hostId` | `participants.find(p => p.id === room.hostId)?.name` |

---

## Existing Entities (for reference)

### RoomSnapshot (unchanged)

| Field            | Type                 | Used by this feature |
|------------------|----------------------|----------------------|
| `code`           | `string`             | No |
| `status`         | `"lobby" \| "active"` | Guard (must be `"active"` to show game) |
| `hostId`         | `string`             | **Yes** — identifies the drawer |
| `participants`   | `Participant[]`      | **Yes** — find drawer name, build role list |
| `availableWords` | `string[]`           | **Yes** — `[0]` is the secret word |
| `roles`          | `ParticipantRole[]`  | No (unused by this feature) |

### Participant (unchanged)

| Field      | Type     | Used by this feature |
|------------|----------|----------------------|
| `id`       | `string` | **Yes** — matched against `hostId` to determine drawer |
| `name`     | `string` | **Yes** — displayed as drawer label for all players |
| `joinedAt` | `string` | No |

---

## Frontend File Changes

### `frontend/src/pages/GamePage.tsx`

- Compute `isDrawer` from `participantId === room.hostId`
- Compute `secretWord` from `room.availableWords[0]`
- Compute `drawerParticipant` from `room.participants.find(p => p.id === room.hostId)`
- Render secret word card (drawer only) or placeholder card (guessers)
- Render role label in Player Info card ("Drawer" or "Guesser")
- Render drawer name in game header or sidebar for all participants

No other files require changes.
