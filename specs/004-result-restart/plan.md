# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-state-host` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart/spec.md`

## Summary

Complete the game loop: first correct guess transitions the room to `result`; all players see the revealed word, final scores, and guess history via polling; the host restarts to `lobby` with round state cleared and players preserved. Extends `RoomStatus`, `submitGuess`, `toRoomSnapshot`, adds `restartRoom` + `POST /restart`, and a new frontend `ResultPage` with route guards across lobby/game/result.

## Technical Context

**Language/Version**: TypeScript (Node 18+, ES modules)  
**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite  
**Storage**: In-memory `roomStore.ts`  
**Testing**: Vitest (backend); manual two-tab full-loop validation per quickstart.md  
**Target Platform**: Local dev — backend `:3001`, frontend `:5173`  
**Project Type**: Web monorepo (`backend/` + `frontend/`)  
**Performance Goals**: Result view sync within ~5 s via 2 s polling  
**Constraints**: HTTP polling only; no new dependencies  
**Scale/Scope**: Single round end + one restart cycle per lab validation  

## Constitution Check

Reference: `.specify/memory/constitution.md` (v1.0.0)

| Gate | Requirement | Pass? |
|------|-------------|-------|
| Brownfield First | Extends existing room store, pages, components | ✅ |
| Spec traceability | Maps to FR-001–FR-012 and user stories | ✅ |
| Scope constraints | Polling only; in-memory; no out-of-scope features | ✅ |
| TypeScript & Zod | Typed status + Zod on restart endpoint | ✅ |
| Deterministic rules | Correct guess ends round; scoring unchanged | ✅ |
| Incremental validation | Two-tab full loop in quickstart.md | ✅ |
| Build health | Both builds pass | ✅ |

Post-design re-check: All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/rooms-api.md
└── tasks.md          # /speckit-tasks
```

### Source Code changes

```text
backend/
├── src/models/game.ts           # RoomStatus += "result"
├── src/services/roomStore.ts    # submitGuess → result; restartRoom; snapshot rules
├── src/services/roomStore.test.ts
├── src/api/schemas.ts           # restartRoomSchema
└── src/api/rooms.ts             # POST /:code/restart

frontend/
├── src/pages/ResultPage.tsx     # NEW — word, scores, history, host restart
├── src/pages/GamePage.tsx       # redirect to /result; poll detects result
├── src/pages/LobbyPage.tsx      # redirect to /result if status result
├── src/components/ResultPanel.tsx  # wire or replace with result content
├── src/routes/index.tsx         # + /result route
├── src/services/api.ts          # restartRoom; status type += result
└── src/state/roomStore.ts       # restartRoom action
```

## Data Flow

```text
Correct guess
  → submitGuess sets status=result
  → submitter navigates to /result
  → other tabs poll → /result

Result page (2s poll)
  → GET snapshot with secretWord for all
  → display Scoreboard + GuessHistory + word

Host restart
  → POST /restart
  → status=lobby, round fields cleared
  → all tabs poll → /lobby
```

## Implementation Sequence

1. **Model**: Add `"result"` to `RoomStatus` (backend + frontend types).
2. **submitGuess**: On correct, set `status = "result"`.
3. **Guards**: Confirm draw/guess return 409 when not `playing`.
4. **toRoomSnapshot**: Result branch — word/scores/guesses/strokes for all viewers.
5. **restartRoom** service + tests.
6. **API**: `POST /rooms/:code/restart` + Zod schema.
7. **Frontend API/store**: `restartRoom`.
8. **ResultPage**: Poll, display outcomes, host restart button.
9. **Routes**: Register `/result`; guards on Game/Lobby/Result pages.
10. **GamePage**: Navigate to result on correct guess response or poll.
11. **Validate**: quickstart.md full loop + builds.

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Unit | Correct guess → `result`; mutations blocked in `result`; restart reset |
| Manual | quickstart.md §1–§5 two-tab full loop |
| Regression | Scenarios 1–3 behaviors unchanged during `lobby`/`playing` |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Tabs desync on result | Server status is source of truth; poll on all pages |
| Snapshot hides word on result | Explicit result branch in `toRoomSnapshot` |
| Restart leaves stale game UI | ResultPage poll redirects to lobby |

## Complexity Tracking

No violations.

## Artifact Index

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/rooms-api.md](./contracts/rooms-api.md)
- [quickstart.md](./quickstart.md)

**Next command**: `/speckit-tasks`
