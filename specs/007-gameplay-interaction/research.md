# Research Notes — Gameplay Interaction Feature

**Branch**: `007-gameplay-interaction` | **Date**: 2026-07-06

## Overview

No formal unknowns remained after specification clarification. All technical decisions were confirmed by the spec, constitution, and existing codebase patterns. This document records the design decisions made during implementation.

## Decisions

### Drawing Canvas: HTML Canvas API (no library)

- **Decision**: Use raw HTML `<canvas>` element with the Canvas 2D API.
- **Rationale**: The constitution forbids adding new top-level dependencies without explicit justification. A single black pen with fixed stroke width requires no library — Canvas 2D API provides `lineTo`, `stroke`, `lineWidth`, `lineCap`, `lineJoin` for freehand drawing. Adding Fabric.js, Paper.js, or similar would violate Principle IV (Brownfield Enhancement).
- **Alternatives considered**: 
  - Fabric.js — richer abstraction but unnecessary dependency
  - SVG overlay — less performant for real-time freehand drawing
  - OffscreenCanvas — premature optimization for current scale

### Stroke Data Model: Point arrays

- **Decision**: Each stroke is an array of `{x, y}` points. Completed strokes sent to server on `pointerup`.
- **Rationale**: Minimal data transfer (~bytes per point), supports smooth replay on guesser clients. Server stores strokes verbatim; no interpolation or compression needed at this scale.
- **Alternatives considered**:
  - Image blobs (PNG/JPEG) — larger payloads, no server-side compositing needed
  - SVG paths — more complex serialization, harder to construct incrementally

### Guess Validation: Frontend + Backend

- **Decision**: Trim and reject empty on both layers.
- **Rationale**: Principle III (Validation Rigor) mandates defense-in-depth. Frontend catches immediately for UX. Backend Zod schema is the security boundary.
- **Frontend**: Inline error before `fetch()`. Button disabled while submitting.
- **Backend**: Zod `submitGuessSchema` with `.trim().min(1)`. Server also validates drawer cannot submit, and already-correct guessers are rejected with 400.

### Duplicate Correct Guess: 400 Rejection

- **Decision**: Backend returns 400 with message "You already guessed correctly!".
- **Rationale**: Clarified during spec review. Prevents confusion from silent no-ops or scoring noise.
- **Alternatives considered**:
  - Accept but score 0 — pollutes guess history
  - Silent ignore — confusing UX; no feedback to user

### Polling Strategy: Reuse LobbyPage Pattern

- **Decision**: GamePage uses the same 2s interval + ref-based guard pattern as LobbyPage.
- **Rationale**: Consistent with codebase patterns (Principle IV). Avoids reinventing the polling mechanism. The existing `fetchRoom()` method already returns updated snapshots including new fields.

### Canvas Sync: Optimistic Local + Server Confirmation

- **Decision**: Drawer strokes appear locally immediately via canvas 2D drawing. On `pointerup`, the complete stroke is POSTed to the server. Guesser clients see strokes on next poll.
- **Rationale**: Immediate feedback for the drawer is critical for UX. The ~2s delay for guessers is an accepted tradeoff (documented in spec Assumptions).
