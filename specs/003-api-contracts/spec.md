# Feature Specification: API Contracts & Drawing Canvas

**Feature Branch**: `003-api-contracts`  
**Created**: 2026-06-01  
**Status**: Draft  
**Depends On**: `001-gameplay-flow`, optionally `002-room-polish`  
**Input**: Need for comprehensive API documentation and drawing canvas support.

## Overview

This feature formalizes API contracts with full request/response schemas, adds comprehensive backend tests, and introduces the drawing canvas API (for future drawing UI implementation). The goal is to ensure backward compatibility, enable confident frontend/backend development in parallel, and lay groundwork for Scenario 3 (drawer canvas support).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprehensive API Documentation (Priority: P1)

Developers can reference complete API schemas, status codes, and error responses without reading code.

**Why this priority**: Clear contracts enable parallel frontend/backend work and reduce integration issues.

**Independent Test**: Read API docs; verify all endpoints, request/response shapes, and error cases are documented.

**Acceptance Scenarios**:

1. **Given** a developer reads `/specs/003-api-contracts/contracts/api.md`, **When** they look up the "Create Room" endpoint, **Then** they see request schema, response schema, possible error codes, and a curl example.
2. **Given** the "Start Round" endpoint is called with invalid input (e.g., missing `playerId`), **When** the request is rejected, **Then** the error response includes status 400 and a message describing the validation error.
3. **Given** a developer implements a new feature endpoint, **When** they add it to the codebase, **Then** they also document it in the API contract file with schema, examples, and error handling.
4. **Given** the API contracts change (e.g., new field added to room response), **When** the change is deployed, **Then** the contract document is updated in the same PR.

---

### User Story 2 - Backend API Tests (Priority: P2)

All API endpoints have automated tests covering happy paths, validation errors, and edge cases.

**Why this priority**: Endpoints are currently tested only via manual browser validation; automated tests catch regressions.

**Independent Test**: Run backend test suite; verify all endpoints are tested and all tests pass.

**Acceptance Scenarios**:

1. **Given** the `POST /rooms` endpoint is implemented, **When** the test suite runs, **Then** tests verify: valid request succeeds, missing fields are rejected, duplicate codes are handled.
2. **Given** the `GET /rooms/:code` endpoint is called with a non-existent code, **When** tests run, **Then** the test asserts a 404 response and appropriate error message.
3. **Given** the `POST /rooms/:code/guesses` endpoint is called with a guess, **When** tests run, **Then** tests verify trimming, case-insensitivity, empty rejection, and scoring.
4. **Given** all tests pass locally, **When** CI runs tests on a PR, **Then** the PR cannot merge if any test fails.

---

### User Story 3 - Drawing Canvas API Foundation (Priority: P2)

The backend exposes endpoints for drawing canvas operations (save/load strokes) to support future canvas UI.

**Why this priority**: Scenario 3 requires the drawer to draw; we need backend support.

**Independent Test**: Call drawing endpoints; verify strokes are persisted per round and retrieved correctly.

**Acceptance Scenarios**:

1. **Given** the drawer is in an active round, **When** they post drawing strokes to `/rooms/:code/rounds/current/canvas`, **Then** the strokes are saved and visible to all players.
2. **Given** a guesser opens the game view, **When** they request the current round state, **Then** the response includes `canvas: { strokes: [...] }` if strokes have been posted.
3. **Given** a round ends, **When** the next round begins, **Then** the canvas is cleared (empty strokes array).
4. **Given** the drawer submits strokes with coordinates and color, **When** the request is processed, **Then** each stroke is validated (x/y within bounds, color is hex) and saved.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-201**: All API endpoints MUST be documented in `/specs/003-api-contracts/contracts/api.md` with request schema, response schema, status codes, and examples.
- **FR-202**: Response errors MUST include HTTP status code (400, 404, 500) and a descriptive message field (not empty).
- **FR-203**: Request validation MUST reject invalid input with status 400 and detail which field is invalid (e.g., "playerName is required").
- **FR-204**: All endpoints defined in 001-gameplay-flow (create, join, start, guess, restart) MUST have backend tests.
- **FR-205**: Drawing canvas endpoint `/POST /rooms/:code/rounds/current/canvas` MUST accept `{ strokes: Stroke[] }` and persist per round.
- **FR-206**: Drawing strokes MUST include `{ x: number, y: number, color: string, pressure: number, timestamp: number }`.
- **FR-207**: Canvas data MUST be cleared when a round ends (not persisted to next round).
- **FR-208**: GET `/rooms/:code` MUST include `canvas: { strokes: [...] }` in round state if strokes exist.
- **FR-209**: Backend tests MUST use Vitest and achieve ≥80% coverage for api/ and services/ directories.
- **FR-210**: API contract documentation MUST be updated whenever an endpoint is added, removed, or modified.

### Constraints

- No breaking changes to existing endpoints (001-gameplay-flow must remain fully compatible).
- Drawing canvas endpoints are read/write only (no delete/clear endpoint; clearing happens at round end).
- Stroke data is stored in-memory per round (no persistence to database).
- Canvas size is fixed at 800x600 pixels (enforced in schema validation).

### Data Model Extensions

**Stroke** (new):
```typescript
{
  x: number          // 0-800
  y: number          // 0-600
  color: string      // hex color #RRGGBB
  pressure: number   // 0.0-1.0
  timestamp: number  // Unix milliseconds
}
```

**Round** (extended):
```typescript
{
  // ... existing fields
  canvas?: {
    strokes: Stroke[]
  }
}
```
