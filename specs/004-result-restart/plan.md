# Implementation Plan: Result, Restart & Final Validation

**Branch**: `scribble-assignment` (single-branch lab) | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-result-restart/spec.md`

**Feature Group**: 4 of 4 — Scenario 4 — builds on Groups 1–3 (final group)

## Summary

Close the game loop. Add a `result` room state reached by a **host-only End Round** action; in `result` the
secret word is revealed to **all** players alongside the final scores and full guess history (all already in
the snapshot). Add a **host-only Restart** that returns the room to `lobby`, **preserves participants**, and
**clears round state** (drawer, word, guesses, scores → 0). Frontend: host End/Restart controls, a result
view that reveals the word to everyone, and auto-return to `/lobby` when status flips back (mirroring Group 1's
auto-advance). Brownfield: extend the model/store/snapshot and game/lobby pages — no new deps, polling-only.

## Technical Context

**Language/Version**: TypeScript (backend Node 18+ / ESM; frontend React 18 + Vite) — unchanged.

**Primary Dependencies**: Express, Zod (backend); React, React Router, `useSyncExternalStore` (frontend). **No new dependencies.**

**Storage**: In-memory `Map<string, Room>` (no DB).

**Testing**: Vitest service-level tests (`roomStore.test.ts`); manual two-browser validation per quickstart (incl. the full end-to-end game, SC-005).

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`.

**Performance Goals**: Result and post-restart lobby converge on all clients within ~2s (poll interval).

**Constraints**: Polling-only; host-only lifecycle controls; no auth/DB/persistence; reuse Groups 1–3 state; touch only related files.

**Scale/Scope**: Single round per start; restart enables replay from the lobby (no auto-rotation / multi-round carry-over).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Specification Before Implementation | Spec + clarifications committed | ✅ |
| II. Incremental Delivery | Final group; scoped to Scenario 4 | ✅ |
| III. Brownfield Enhancement | Extend status/store/snapshot + game/lobby pages | ✅ |
| IV. Simplicity Over Expansion | One new status value + 2 endpoints; no libs; polling | ✅ |
| V. Validation First | Two-browser quickstart incl. full end-to-end + restart | ✅ |
| VI. AI Responsibility | Plan reviewed + `/speckit.analyze` before implement | ✅ |
| VII. Traceability | Design cites FR IDs | ✅ |
| VIII. Commit Discipline | Per-story `feat(group4):` commits | ✅ |

**Result: PASS** — no violations; Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── plan.md, spec.md, research.md, data-model.md, quickstart.md
├── contracts/rooms-api.md      # end + restart endpoints, result snapshot delta
└── checklists/requirements.md
```

### Source Code (repository root)

```text
backend/src/
├── models/game.ts            # EDIT: widen RoomStatus to "lobby" | "active" | "result"
├── services/roomStore.ts     # EDIT: add endRound() (host-only → status "result"); add restartGame() (host-only → lobby, clear drawer/word/guesses, reset scores 0, preserve participants); reveal word to all when status === "result" in toRoomSnapshot
├── api/schemas.ts            # EDIT: add participantActionSchema ({ participantId }) for end/restart
└── api/rooms.ts              # EDIT: add POST /:code/end and POST /:code/restart

frontend/src/
├── services/api.ts           # EDIT: add endRound() and restartGame()
├── state/roomStore.ts        # EDIT: add endRound() and restartGame() actions
├── pages/GamePage.tsx        # EDIT: host "End Round" (active); result view revealing the word to all + host "Restart"; auto-return to /lobby when status === "lobby"
└── pages/LobbyPage.tsx       # (no change expected — existing polling + start gating handle the fresh round)
```

**Structure Decision**: Web-app layout reused. All edits extend existing files; no new modules. The lifecycle
gains one state (`result`) and two host-only endpoints; the result reveal reuses the existing snapshot `word`
field (now exposed to all in `result`).

## Phase 0 — Research

See [research.md](./research.md). Clarifications fixed the lifecycle (host ends the round; restart → lobby).
Research records: the `result` state + word-reveal approach, host-authoritative end/restart, the restart reset
set (and why scores reset here — the Group 3 carry-forward), and reusing polling for result/lobby convergence.

## Phase 1 — Design & Contracts

- **Data model**: [data-model.md](./data-model.md) — `RoomStatus += "result"`; lifecycle state machine; the
  restart reset rules; word-reveal-on-result rule. All FR-traced.
- **Contracts**: [contracts/rooms-api.md](./contracts/rooms-api.md) — new `POST /rooms/:code/end` and
  `POST /rooms/:code/restart` (host 403; result/lobby transitions), result snapshot delta (word revealed to all),
  contract-test checklist.
- **Quickstart**: [quickstart.md](./quickstart.md) — two-browser end→result→restart, plus the full end-to-end
  game (SC-005) and no-regression checks.
- **Agent context**: `CLAUDE.md` SPECKIT block updated to point at this plan.

## Data Flow (summary)

1. **End** (host, active) → `POST /rooms/:code/end` → 403 non-host; sets `status = "result"`.
2. **Result poll** → snapshot now includes `word` for **all** viewers (because status is `result`), plus the
   existing final scores + full guess history. All clients show the result within ~2s.
3. **Restart** (host) → `POST /rooms/:code/restart` → 403 non-host; sets `status = "lobby"`, clears
   `drawerId`/`secretWord`/`guesses`, resets every `score` to 0, keeps `participants`.
4. **Lobby poll** → clients on `/game` observe `status === "lobby"` and navigate to `/lobby`; Group 1 start
   gating applies again for the next round.

## Complexity Tracking

*No constitution violations — section intentionally empty.*
