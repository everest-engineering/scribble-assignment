# Implementation Plan: Result and Restart

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart-validation/spec.md`

## Summary

Complete Scenario 4 on the brownfield stack: extend `toRoomSnapshot` to reveal `secretWord` to all viewers when `status === "result"`; add `restartRoom(code, requesterId)` in `roomStore.ts` (host-only, result→lobby, delete `currentRound`, preserve participants); expose `POST /rooms/:code/restart`. Frontend: enhance `ResultPanel` and `GamePage` for result view (revealed word, scores, history); host-only "Play Again" calling `restartGame` action; auto-navigate all tabs to lobby on restart via polling; lobby detects post-restart state. Create `reflection.md` lab deliverable.

## Technical Context

**Language/Version**: TypeScript (Node 18+, strict) on backend and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest

**Storage**: In-memory `Map` in `roomStore.ts` only

**Testing**: Vitest — extend `roomStore.test.ts`, `schemas.test.ts`, `api.test.ts` per constitution

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`

**Project Type**: Web application (Express REST + React SPA)

**Performance Goals**: 2000 ms polling; restart O(P) only; endpoints < 50 ms p95

**Constraints**: HTTP polling only; snapshot purity with documented result-state exception for word reveal; no WebSockets/DB/auth

**Scale/Scope**: Single round loop completion — result UI, restart, lobby return, final validation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Scenario 4 compliance |
|-----------|----------------------|
| I. Code Quality | `restartRoom` in `roomStore.ts`; result-state branch in `toRoomSnapshot`; typed errors |
| II. Testing | Happy/reject paths for `restartRoom`; restart schema test; api client test; result word reveal test |
| III. UX | Host-only Play Again; revealed word for all in result; lobby auto-sync; disabled draw/guess in result |
| IV. Performance | Reuse `useRoomPolling`; no new intervals |
| Non-negotiable | No WebSockets/DB/auth; no drawer rotation; scores reset on restart (A4) |

**Constitutional exception**: Snapshot purity (Principle I) — `secretWord` is revealed to all viewers when `status === "result"` only. Rationale: README Scenario 4 requires all players see the correct word at round end. Sunset: N/A (permanent game rule).

**Gate status**: PASS with documented snapshot exception for result state.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-api.md
├── spec.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/
├── services/roomStore.ts         # restartRoom; toRoomSnapshot result branch
├── services/roomStore.test.ts
├── api/schemas.ts                # restartRoomSchema
├── api/schemas.test.ts
└── api/rooms.ts                  # POST /restart

frontend/src/
├── components/ResultPanel.tsx    # revealed word, result banner
├── pages/GamePage.tsx            # result layout, Play Again, lobby redirect
├── pages/LobbyPage.tsx           # handle result→lobby via poll (already navigates from game)
├── services/api.ts               # restartGame client
├── services/api.test.ts
└── state/roomStore.ts            # restartGame action

reflection.md                     # lab deliverable (repo root)
```

## Implementation Sequence

1. Backend: error classes + `restartRoom` + snapshot result reveal
2. Backend: schema + route + error mapping
3. Backend tests
4. Frontend: API client + store action
5. Frontend: ResultPanel + GamePage result/restart UI
6. Frontend tests
7. reflection.md + precheck

## Risks

| Risk | Mitigation |
|------|------------|
| Snapshot purity regression in playing state | Test drawer-only mask when playing; all reveal only when result |
| Guest stuck on game after restart | GamePage effect redirects on `status === "lobby"` |
| Host navigates before guest polls | Guest poll detects lobby within 2 s |

## Testing Strategy

- Unit: `restartRoom` host/non-host/invalid state; `toRoomSnapshot` word reveal in result vs playing
- Schema: restart body validation
- API client: POST restart URL/method/body
- Manual: two-tab Validation section in spec.md
- CI: `pre-evaluation-check.mjs`
