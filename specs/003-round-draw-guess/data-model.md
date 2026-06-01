# Data Model: Active Round Drawing, Guessing, and Scoring

**Feature**: `003-round-draw-guess` | **Date**: 2026-06-01

## Room (extensions)

| Field | Type | Notes |
|-------|------|-------|
| `canvasStrokes` | `CanvasStroke[]` | Replaced on drawer PUT / clear |
| `guesses` | `Guess[]` | Append-only for current round |
| `secretWord` | string | Server-only; never in guesser snapshot |

## Participant (extensions)

| Field | Type | Notes |
|-------|------|-------|
| `score` | number | Initialized to 0 at round start (FR-010) |

## CanvasStroke

| Field | Type | Notes |
|-------|------|-------|
| `points` | `{ x: number; y: number }[]` | Polyline |
| `color` | string | Optional default black |
| `width` | number | Optional default 2 |

## Guess

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | UUID |
| `participantId` | string | Guesser |
| `participantName` | string | Display |
| `text` | string | Trimmed stored text |
| `isCorrect` | boolean | |
| `createdAt` | ISO string | Order for history |

## RoomSnapshot (game / drawing)

| Field | Notes |
|-------|-------|
| `canvasStrokes` | All participants |
| `guesses` | All participants; no secret word in entries |
| `participants[].score` | Visible to all |
| `viewer.secretWord` | Drawer only (from 002) |

## Validation

- Canvas PUT: caller must be `drawerParticipantId`, `status === drawing`
- Guess POST: caller must be guesser; trimmed text non-empty; drawer rejected
- Compare: case-insensitive after trim
