# Data Model: First Round Drawer and Secret Word

**Feature**: `002-first-round-drawer` | **Date**: 2026-06-01

## Room (extensions)

| Field | Type | Notes |
|-------|------|-------|
| `status` | `"lobby" \| "drawing" \| "result"` | Start sets `drawing` for round 1 |
| `hostParticipantId` | string | From feature 001 |
| `roundNumber` | number | `1` after first start |
| `drawerParticipantId` | string | Exactly one drawer per round |
| `secretWord` | string | Stored server-side; not sent to guessers |

## Participant (extensions)

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Trimmed before round start |
| `role` | `"drawer" \| "guesser"` | Set at round start for active round |

## RoomSnapshot (viewer-scoped)

| Field | Type | Notes |
|-------|------|-------|
| `drawerParticipantId` | string | Visible to all (FR-008) |
| `viewer.role` | `"drawer" \| "guesser"` | From participant id |
| `viewer.secretWord` | string \| omitted | Present only when viewer is drawer |
| `participants[]` | | Each entry includes `role` for UI labels |

## State transition (this feature)

```text
lobby --POST /start (host, valid names, n>=2)--> drawing (round 1)
  - assign drawer (host or earliest joiner)
  - select secretWord deterministically
  - set participant roles
```

Handoff to `003-round-draw-guess` for canvas/guessing during `drawing`.
