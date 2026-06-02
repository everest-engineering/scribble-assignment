# Tasks: API Contracts & Drawing Canvas (003-api-contracts)

**Input**: Design documents from `/specs/003-api-contracts/`

## Phase 1: API Documentation (Blocking)

- [ ] T001 Create `contracts/api.md` with complete endpoint documentation — specs/003-api-contracts/contracts/api.md
- [ ] T002 Document POST /rooms endpoint (schema, response, errors) — contracts/api.md
- [ ] T003 Document POST /rooms/:code/join endpoint — contracts/api.md
- [ ] T004 Document POST /rooms/:code/start endpoint — contracts/api.md
- [ ] T005 Document POST /rooms/:code/guesses endpoint — contracts/api.md
- [ ] T006 Document POST /rooms/:code/restart endpoint — contracts/api.md
- [ ] T007 Document GET /rooms/:code endpoint with canvas field — contracts/api.md
- [ ] T008 Document POST /rooms/:code/rounds/current/canvas endpoint (new) — contracts/api.md
- [ ] T009 Add curl examples for all endpoints — contracts/api.md

**Acceptance**: All endpoints documented with request/response schemas, error codes, and curl examples.

---

## Phase 2: Data Model Extensions (Blocking)

- [ ] T010 Add Stroke type to game.ts with x, y, color, pressure, timestamp — backend/src/models/game.ts
- [ ] T011 Add Canvas type with strokes array — backend/src/models/game.ts
- [ ] T012 Update Round type to include optional `canvas?: Canvas` — backend/src/models/game.ts

**Acceptance**: Types exported and used in room store and schemas.

---

## Phase 3: Zod Schemas (Blocking)

- [ ] T013 Add StrokeInputSchema with validation — backend/src/api/schemas.ts
- [ ] T014 Add CanvasInputSchema (array of strokes) — backend/src/api/schemas.ts
- [ ] T015 Validate stroke coordinates (0-800 x, 0-600 y) — backend/src/api/schemas.ts
- [ ] T016 Validate stroke color format (hex #RRGGBB) — backend/src/api/schemas.ts
- [ ] T017 Update schemas.test.ts to cover new schemas with valid/invalid inputs — backend/src/api/schemas.test.ts

**Acceptance**: Schemas validate strokes correctly; invalid data rejected with descriptive errors.

---

## Phase 4: Drawing Canvas Endpoints (Core)

- [ ] T018 Add `updateCanvas(code, strokes)` to roomStore — backend/src/services/roomStore.ts
- [ ] T019 Implement canvas clearing when round ends — backend/src/services/roomStore.ts
- [ ] T020 Include canvas field in room snapshot if present — backend/src/services/roomStore.ts
- [ ] T021 Implement POST /rooms/:code/rounds/current/canvas endpoint — backend/src/api/rooms.ts
- [ ] T022 Validate that only drawer can post to canvas — backend/src/api/rooms.ts
- [ ] T023 Return 404 if room/round not found, 400 if round not active — backend/src/api/rooms.ts

**Acceptance**: Strokes persisted per round; canvas cleared on round end; drawer validation enforced.

---

## Phase 5: Comprehensive API Tests (Core)

- [ ] T024 Create backend/__tests__/api.integration.test.ts — backend/src/__tests__/api.integration.test.ts
- [ ] T025 Test POST /rooms (success, missing fields, duplicate code) — api.integration.test.ts
- [ ] T026 Test POST /rooms/:code/join (success, invalid code, invalid name) — api.integration.test.ts
- [ ] T027 Test POST /rooms/:code/start (host-only, requires 2 players) — api.integration.test.ts
- [ ] T028 Test POST /rooms/:code/guesses (trimming, scoring, empty rejection) — api.integration.test.ts
- [ ] T029 Test POST /rooms/:code/restart (state clearing, host-only) — api.integration.test.ts
- [ ] T030 Test GET /rooms/:code (correct format, canvas included) — api.integration.test.ts
- [ ] T031 Test POST /rooms/:code/rounds/current/canvas (strokes accepted) — api.integration.test.ts
- [ ] T032 Test canvas stroke validation (bounds, color, pressure) — api.integration.test.ts
- [ ] T033 Test canvas clears on round end (new round = empty canvas) — api.integration.test.ts

**Acceptance**: All tests pass; ≥80% coverage for api/ and services/; backward compatible.

---

## Phase 6: Schema Validation Tests

- [ ] T034 Test StrokeInputSchema with valid strokes — backend/src/api/schemas.test.ts
- [ ] T035 Test hex color validation (#RRGGBB and edge cases) — schemas.test.ts
- [ ] T036 Test coordinate bounds (out-of-bounds rejected) — schemas.test.ts
- [ ] T037 Test error messages are field-specific and helpful — schemas.test.ts

**Acceptance**: All schema tests pass; validation errors are descriptive.

---

## Phase 7: Tests & Verification

- [ ] T038 Run full backend test suite locally: `npm run test` in backend/ — verify all tests pass
- [ ] T039 Check test coverage report: minimum ≥80% in api/ and services/ — backend/coverage/
- [ ] T040 Verify backward compatibility (existing endpoints unchanged) — manual curl tests
- [ ] T041 Manual test of canvas endpoint with Postman or curl — verify strokes persisted and returned

**Acceptance**: All tests pass; coverage ≥80%; no breaking changes; manual tests successful.

---

## Phase 8: Documentation & Polish

- [ ] T042 Update backend README with testing instructions — backend/README.md
- [ ] T043 Add code comments to drawing-related methods — backend/src/services/roomStore.ts
- [ ] T044 Run linting and fix issues — `npm run lint` in backend/
- [ ] T045 Final review: API documentation matches implementation — contracts/api.md vs. code

**Acceptance**: Code passes linting; documentation complete and accurate; naming is clear.

---

## Dependency Graph

```
T001–T009 (Docs) → can run in parallel
T010–T012 (Models) → blocking for services
T013–T017 (Schemas) → parallel with models
         ↓
T018–T023 (Endpoints) → depends on T010–T012, T013–T017
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

- Canvas is in-memory only (not persisted to database).
- Canvas clears automatically when a round ends; no explicit clear endpoint needed.
- Stroke coordinates are 0-800 (x) and 0-600 (y); validated in schema.
- All error responses must include descriptive message (not generic errors).
- No breaking changes to existing 001-gameplay-flow endpoints.
