# Data Model: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer-flow | **Date**: 2026-05-30

**Builds on**: [001-room-setup-lobby/data-model.md](../001-room-setup-lobby/data-model.md)

## Entity Relationship

```text
Room 1──* Participant
Room ── hostParticipantId ──> Participant (creator)
Room ── drawerParticipantId ──> Participant (host at start; null in lobby)
Room ── secretWord (internal; viewer-filtered in API)
Participant ── role ──> "drawer" | "guesser" (assigned at start; lobby has no role)
```

## Room (internal — backend)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | yes | Unique 4-character uppercase code |
| `status` | `"lobby" \| "playing"` | yes | Lifecycle phase |
| `hostParticipantId` | `string` | yes | UUID of creating participant |
| `drawerParticipantId` | `string \| null` | yes | Set to host on start; `null` in lobby |
| `secretWord` | `string \| null` | yes | Active round word; set on start; `null` in lobby |
| `participants` | `Participant[]` | yes | Ordered list of joined players |
| `createdAt` | `string` (ISO) | yes | Creation timestamp |
| `updatedAt` | `string` (ISO) | yes | Last mutation timestamp |

### Validation rules

- `drawerParticipantId` and `secretWord` MUST be `null` while `status === "lobby"`
- On successful start: `drawerParticipantId === hostParticipantId`
- On successful start: `secretWord === STARTER_WORDS[0]` (`"rocket"`)
- `secretWord` MUST NOT appear in snapshot when viewer is not the drawer

### State transitions

```text
[create] ──> lobby (drawerParticipantId: null, secretWord: null)
lobby ──(host start, ≥2 players)──> playing (drawer + word assigned)
```

Restart clearing round fields is Scenario 4.

## Participant (internal — backend)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | yes | Stable session identity |
| `name` | `string` | yes | Trimmed display name; non-empty |
| `joinedAt` | `string` (ISO) | yes | Join timestamp |

### Validation rules (Scenario 2)

- Name MUST be trimmed on create/join
- Trimmed name MUST have length ≥ 1 (reject empty/whitespace-only)
- Duplicate names within a room still allowed

## RoomSnapshot (API response — viewer-aware)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | yes | Room code |
| `status` | `"lobby" \| "playing"` | yes | Current room phase |
| `hostParticipantId` | `string` | yes | Host participant id |
| `drawerParticipantId` | `string \| null` | yes | Current drawer; `null` in lobby |
| `participants` | `ParticipantSnapshot[]` | yes | Player list with roles when playing |
| `availableWords` | `string[]` | yes | Starter word list (unchanged) |
| `roles` | `("drawer" \| "guesser")[]` | yes | Starter roles (unchanged) |
| `secretWord` | `string` | no | **Only** when `viewerParticipantId === drawerParticipantId` |

## ParticipantSnapshot (API response)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Participant id |
| `name` | `string` | yes | Trimmed display name |
| `joinedAt` | `string` | yes | Join time |
| `isHost` | `boolean` | yes | `true` when `id === room.hostParticipantId` |
| `role` | `"drawer" \| "guesser" \| null` | yes | `null` in lobby; assigned when `playing` |

## Frontend session state (`RoomState`)

Unchanged shape; extended snapshot fields consumed by pages.

### Derived game UI values (not persisted)

| Derived | Logic |
|---------|-------|
| `viewer` | `participants.find(p => p.id === participantId)` |
| `viewerRole` | `viewer?.role ?? null` |
| `isDrawer` | `participantId === room.drawerParticipantId` |
| `secretWord` | `room.secretWord` (undefined for guessers — field absent from API) |
| `drawerName` | Name of participant where `role === "drawer"` |

## Mapping spec requirements to model

| Requirement | Model support |
|-------------|---------------|
| FR-001–FR-004 | `normalizePlayerName()` on create/join |
| FR-005–FR-006 | `startRoom()` sets `status`, drawer, word |
| FR-007–FR-008 | Game page polling via `GET` snapshot |
| FR-009–FR-011 | `drawerParticipantId`, `ParticipantSnapshot.role` |
| FR-012–FR-013 | `secretWord = STARTER_WORDS[0]` in `startRoom()` |
| FR-014–FR-015 | Viewer-filtered `secretWord` in `toRoomSnapshot()` |
| FR-016 | `GamePage` redirect when `status === "lobby"` (existing) |
