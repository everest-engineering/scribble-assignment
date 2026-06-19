# Implementation Plan: Auto-end Round on Correct Guess

**Branch**: `scribble-assignment` (single-branch lab) | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-auto-end-round/spec.md`

**Type**: Refinement increment — refines Groups 3 & 4

## Summary

Make a correct guess end the round automatically. In `submitGuess`, when a guess is correct, after awarding
the 100 points set the room `status = "result"` (the state Group 4 already defined). Also guard `submitGuess`
so it only accepts guesses while the round is `active` (no guessing once it has ended). Everything else —
the result reveal of the word, the frontend's navigation/result view on status change, the host **End Round**
fallback, and restart — already exists, so this is a **backend-only** change plus a test. No new endpoints,
no model change (`result` already exists), no new dependencies.

## Technical Context

**Language/Version**: TypeScript (backend Node 18+ / ESM; frontend React 18 + Vite) — unchanged.

**Primary Dependencies**: Express, Zod; React, React Router. **No new dependencies.**

**Storage**: In-memory `Map<string, Room>` (no DB).

**Testing**: Vitest service-level tests (`roomStore.test.ts`); manual two-browser validation per quickstart.

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`.

**Performance Goals**: Correct guess ends the round for the guesser immediately and for others within ~2s (poll).

**Constraints**: Polling-only; reuse the existing `result` state; touch only `submitGuess` + its test.

**Scale/Scope**: Single round; ends on the first correct guess.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Specification Before Implementation | Spec committed before planning | ✅ |
| II. Incremental Delivery | Small, focused refinement increment | ✅ |
| III. Brownfield Enhancement | One function changed; reuses existing `result` state | ✅ |
| IV. Simplicity Over Expansion | No new endpoints/model/deps; ~2 lines + a guard | ✅ |
| V. Validation First | Two-browser quickstart + backend test | ✅ |
| VI. AI Responsibility | Plan reviewed + `/speckit.analyze` before implement | ✅ |
| VII. Traceability | Cites FR IDs; supersedes prior clarification explicitly | ✅ |
| VIII. Commit Discipline | Single focused commit | ✅ |

**Result: PASS** — no violations; Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/005-auto-end-round/
├── plan.md, spec.md, research.md, data-model.md, quickstart.md
├── contracts/rooms-api.md      # behavior delta for POST /:code/guess
└── checklists/requirements.md
```

### Source Code (repository root)

```text
backend/src/
├── services/roomStore.ts       # EDIT: submitGuess — guard to active rounds; on a correct guess set status="result" after scoring
└── services/roomStore.test.ts  # EDIT: tests for auto-end (correct → result), incorrect → still active, guess-after-end rejected

# No frontend changes: the client submitGuess action already applies the returned snapshot, and GamePage
# already shows the result view / navigates on status changes (Group 4). The host End Round fallback and
# restart are unchanged.
```

**Structure Decision**: Backend-only change in one service function. The `result` state, its word reveal, the
frontend status handling, the End Round fallback, and restart all already exist — this increment only adds
the automatic transition (and the active-round guard for guesses).

## Phase 0 — Research

See [research.md](./research.md). Decisions: end on the first correct guess (after scoring); enforce
guesses-only-while-active so an ended round can't accept more guesses; reuse the existing `result` state and
all existing reveal/navigation rather than adding anything new.

## Phase 1 — Design & Contracts

- **Data model**: [data-model.md](./data-model.md) — no schema change; documents the `submitGuess` behavior
  delta (active-guard + set `result` on correct) and the unchanged result reveal.
- **Contracts**: [contracts/rooms-api.md](./contracts/rooms-api.md) — `POST /rooms/:code/guess` delta: returns
  a `result`-status snapshot on a correct guess; rejects guesses when the round isn't active; contract-test checklist.
- **Quickstart**: [quickstart.md](./quickstart.md) — two-browser: correct guess auto-ends to result for both;
  incorrect keeps playing; End Round fallback + restart still work (no regression).
- **Agent context**: `CLAUDE.md` SPECKIT block updated to point at this plan.

## Data Flow (summary)

1. **Guess** → `submitGuess` rejects if the round isn't `active`; else validates (drawer/empty/already-scored).
2. **Correct** → award 100, then set `status = "result"`; return snapshot (already reveals the word to all).
3. **Guesser's client** applies the returned `result` snapshot → shows the result view immediately.
4. **Other clients** observe `status === "result"` on their next ~2s poll → result view. (Host End Round / restart unchanged.)

## Complexity Tracking

*No constitution violations — section intentionally empty.*
