# Implementation Plan: API Contracts & Drawing Canvas

**Branch**: `003-api-contracts` | **Date**: 2026-06-01 | **Spec**: [../spec.md](../spec.md)  
**Input**: Feature specification from `/specs/003-api-contracts/spec.md`

## Summary

This plan formalizes backend API contracts, adds comprehensive tests for all endpoints, and introduces drawing canvas support. Changes include updated Zod schemas, test coverage for all routes, and new drawing-related types and endpoints.

## Technical Context

**Language/Version**: TypeScript on Node.js  
**Primary Dependencies**: Express, Zod, Vitest  
**Storage**: In-memory (no database)  
**Testing**: Vitest for unit/integration tests  
**Target Platform**: Node.js backend  
**Performance Goals**: All tests run in <5 seconds  
**Constraints**: No breaking changes to existing endpoints; in-memory only  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- This feature extends existing endpoints without breaking changes.
- Adds in-memory drawing canvas support (no database).
- All tests are unit/integration; no external dependencies.
- Preserves in-memory architecture and polling model.

## Project Structure

### Files Modified/Created

```text
backend/src/
├── api/
│   ├── rooms.ts (modify)          - Add /canvas endpoints
│   ├── schemas.ts (modify)        - Add Stroke and Canvas schemas
│   ├── router.ts (no change)
├── models/
│   ├── game.ts (modify)           - Add Stroke, Canvas types
├── services/
│   ├── roomStore.ts (modify)      - Add canvas persistence logic
│   ├── roomStore.test.ts (modify) - Add drawing tests
├── __tests__/
│   ├── api.integration.test.ts (new) - Full endpoint tests
│   ├── schemas.validation.test.ts (new) - Schema validation tests
specs/003-api-contracts/
├── contracts/
│   └── api.md (new)               - Complete API documentation
```

## Implementation Phases

### Phase 1: API Documentation (Blocking)

Goal: Document all existing endpoints and new drawing endpoints.

- [ ] T001 Create `contracts/api.md` with all endpoints documented — specs/003-api-contracts/contracts/api.md
- [ ] T002 Document POST /rooms with schema and error codes — contracts/api.md
- [ ] T003 Document POST /rooms/:code/join with schema and error codes — contracts/api.md
- [ ] T004 Document POST /rooms/:code/start with schema — contracts/api.md
- [ ] T005 Document POST /rooms/:code/guesses with schema and validation — contracts/api.md
- [ ] T006 Document POST /rooms/:code/restart with schema — contracts/api.md
- [ ] T007 Document GET /rooms/:code response schema (including canvas if present) — contracts/api.md
- [ ] T008 Document new POST /rooms/:code/rounds/current/canvas with schema — contracts/api.md
- [ ] T009 Add curl examples for all endpoints — contracts/api.md

**Acceptance**: All endpoints documented with request/response schemas, error codes, and examples.

---

### Phase 2: Data Model Extensions (Blocking)

Goal: Add drawing canvas types to models.

- [ ] T010 Add Stroke type to game.ts — backend/src/models/game.ts
- [ ] T011 Add Canvas type (with strokes array) to game.ts — backend/src/models/game.ts
- [ ] T012 Update Round type to include optional `canvas: Canvas` — backend/src/models/game.ts

**Acceptance**: All new types are exported and used in services.

---

### Phase 3: Zod Schemas (Blocking)

Goal: Add validation schemas for canvas operations.

- [ ] T013 Add StrokeInput schema (x, y, color hex, pressure, timestamp) — backend/src/api/schemas.ts
- [ ] T014 Add CanvasInput schema (array of strokes) — backend/src/api/schemas.ts
- [ ] T015 Add validation for stroke bounds (0-800 x, 0-600 y) — backend/src/api/schemas.ts
- [ ] T016 Add validation for color hex format (#RRGGBB) — backend/src/api/schemas.ts
- [ ] T017 Test all schemas with valid and invalid inputs — backend/src/api/schemas.test.ts (already exists)

**Acceptance**: Schemas validate input correctly; invalid data is rejected with descriptive errors.

---

### Phase 4: Drawing Canvas Endpoints (Core Implementation)

Goal: Implement POST /canvas endpoint and extend room store.

- [ ] T018 Add `updateCanvas(code: string, strokes: Stroke[])` method to roomStore — backend/src/services/roomStore.ts
- [ ] T019 Ensure canvas is cleared when round ends (reset to empty strokes) — backend/src/services/roomStore.ts
- [ ] T020 Add canvas field to room snapshot in GET /rooms/:code — backend/src/services/roomStore.ts
- [ ] T021 Implement POST /rooms/:code/rounds/current/canvas endpoint — backend/src/api/rooms.ts
- [ ] T022 Validate that only active round accepts canvas updates — backend/src/api/rooms.ts
- [ ] T023 Return 404 if room or round not found, 400 if round not active — backend/src/api/rooms.ts

**Acceptance**: Strokes posted to canvas endpoint are persisted and returned in room snapshot; canvas clears on round end.

---

### Phase 5: Comprehensive Backend Tests (Core)

Goal: Test all endpoints and edge cases.

- [ ] T024 Create api.integration.test.ts with full endpoint test suite — backend/src/__tests__/api.integration.test.ts
- [ ] T025 Test POST /rooms success and error cases (missing fields, etc.) — api.integration.test.ts
- [ ] T026 Test POST /rooms/:code/join success and error cases — api.integration.test.ts
- [ ] T027 Test POST /rooms/:code/start success and host-only validation — api.integration.test.ts
- [ ] T028 Test POST /rooms/:code/guesses with trimming, case-insensitivity, scoring — api.integration.test.ts
- [ ] T029 Test POST /rooms/:code/restart and state clearing — api.integration.test.ts
- [ ] T030 Test GET /rooms/:code response format and canvas inclusion — api.integration.test.ts
- [ ] T031 Test POST /rooms/:code/rounds/current/canvas with valid strokes — api.integration.test.ts
- [ ] T032 Test canvas stroke validation (bounds, color, pressure) — api.integration.test.ts
- [ ] T033 Test canvas clearing on round end — api.integration.test.ts

**Acceptance**: All endpoint tests pass; ≥80% coverage for api/ and services/ directories.

---

### Phase 6: Validation & Schema Tests

- [ ] T034 Test StrokeInput schema with valid/invalid data — backend/src/api/schemas.test.ts
- [ ] T035 Test hex color validation (#RRGGBB format) — schemas.test.ts
- [ ] T036 Test coordinate bounds validation (0-800, 0-600) — schemas.test.ts
- [ ] T037 Test error messages are descriptive (which field failed) — schemas.test.ts

**Acceptance**: All schema tests pass; errors are specific and helpful.

---

### Phase 7: Tests & Verification

- [ ] T038 Run full backend test suite locally: `npm run test` — backend/
- [ ] T039 Check test coverage report; aim for ≥80% in api/ and services/ — backend/coverage
- [ ] T040 Verify no breaking changes to existing endpoints (backward compatibility)
- [ ] T041 Test canvas operations manually via curl or Postman

**Acceptance**: Tests pass; coverage ≥80%; endpoints backward compatible; manual validation successful.

---

### Phase 8: Documentation & Polish

- [ ] T042 Update backend README with testing instructions — backend/README.md (if exists)
- [ ] T043 Add code comments to new drawing-related methods — backend/src/services/roomStore.ts
- [ ] T044 Code cleanup and linting — `npm run lint` in backend/
- [ ] T045 Verify API documentation is complete and matches implementation

---

## Dependencies & Execution Order

```
T001–T009 (Documentation) → parallel
         ↓
T010–T012 (Models) → blocking for services
T013–T017 (Schemas) → parallel with models
         ↓
T018–T023 (Endpoints) → depends on T010–T012
         ↓
T024–T033 (API Tests) → depends on T018–T023
T034–T037 (Schema Tests) → parallel with T024–T033
         ↓
T038–T041 (Verification) → final validation
         ↓
T042–T045 (Polish) → final pass
```

---

## Notes

- All endpoints return errors with descriptive messages (not generic "Error occurred").
- Canvas data is ephemeral (lost on server restart); OK for MVP.
- Stroke coordinates are client-relative (0-800 x, 0-600 y); canvas size validation in schema.
- No breaking changes to 001-gameplay-flow endpoints.
