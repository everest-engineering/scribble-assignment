---
description: "Data model changes for First Round — Drawer Assignment and Secret Word"
---

# Data Model: First Round — Drawer Assignment and Secret Word

**Feature**: specs/002-first-round-drawer/spec.md
**Date**: 2026-06-02

## Overview

Two fields are added to the backend `Room` store entity and two corresponding fields are added to the `RoomSnapshot` API projection. No new entities are introduced. All changes are additive extensions to the existing model.

---

## Backend: `Room` (store entity)

**File**: `backend/src/models/game.ts`

| Field | Type | Nullable | Default | Set when |
|-------|------|----------|---------|----------|
| `drawerId` | `string` | Yes (`null`) | `null` | Set to `hostId` when `POST /rooms/:code/start` transitions status to `"active"` |
| `currentWord` | `string` | Yes (`null`) | `null` | Set to `STARTER_WORDS[0]` when status transitions to `"active"` |

All existing fields (`code`, `hostId`, `status`, `participants`, `createdAt`, `updatedAt`) are unchanged.

**State transitions**:

```
Room created  →  drawerId: null,      currentWord: null
Game started  →  drawerId: hostId,   currentWord: STARTER_WORDS[0]
```

---

## Backend: `RoomSnapshot` (API projection)

**File**: `backend/src/models/game.ts`

| Field | Type | Nullable | Visibility rule |
|-------|------|----------|-----------------|
| `drawerId` | `string` | Yes (`null`) | Always included; identifies the drawer to all participants |
| `currentWord` | `string` | Yes (`null`) | Included as the actual word only when `viewerParticipantId === room.drawerId`; `null` for all other viewers |

All existing fields (`code`, `hostId`, `status`, `participants`, `availableWords`, `roles`) are unchanged.

**`toRoomSnapshot` projection rule**:

```
drawerId:     room.drawerId  (always)
currentWord:  viewerParticipantId === room.drawerId
                ? room.currentWord   ← actual word (e.g. "rocket")
                : null               ← hidden from guessers
```

---

## Frontend: `RoomSnapshot` (TypeScript interface)

**File**: `frontend/src/services/api.ts`

| Field | Type | Notes |
|-------|------|-------|
| `drawerId` | `string \| null` | Mirrors backend snapshot |
| `currentWord` | `string \| null` | Word text for drawer; `null` for guessers |

---

## Validation Rules

- `drawerId` is `null` while `status === "lobby"`; it MUST equal `hostId` once `status === "active"`.
- `currentWord` is `null` while `status === "lobby"`; it MUST be `STARTER_WORDS[0]` once `status === "active"` (stored in `Room`).
- `currentWord` in a `RoomSnapshot` MUST be `null` for any viewer whose `participantId !== room.drawerId`.

---

## No New Entities

The `Round`, `DrawerAssignment`, and `SecretWord` concepts named in the spec are represented directly as fields on `Room` / `RoomSnapshot`. A separate `Round` entity is not warranted at this scope (single-round lab, no rotation).
