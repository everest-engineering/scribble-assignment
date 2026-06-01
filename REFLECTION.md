# Reflection Report — Scribble Lab

**Author**: Assignment implementation (AI-assisted, Spec Kit workflow)  
**Date**: 2026-06-01

---

## What did the starter app already have?

The starter was a **runnable brownfield scaffold**, not a complete game:

- **Monorepo layout**: `frontend/` (Vite + React 18 + TypeScript) and `backend/` (Express + TypeScript).
- **Pages & routing**: Start, Create Room, Join Room, Lobby, and Game routes with Scribble branding.
- **Minimal REST API**: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` with an in-memory `Map` in `roomStore`.
- **Seed data**: Five words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and role labels (`drawer`, `guesser`) in `starterData.ts`.
- **UI placeholders** on the game screen: static canvas area, guess input that did not submit, scoreboard showing “0”, and non-functional result copy.
- **No** host identity, start-game endpoint, drawing sync, guess validation/scoring, `result` state, or restart flow.

The README correctly described this as scaffold-only; implementation filled the gap through four Spec Kit feature folders (001–004).

---

## What did you add?

### Process & artifacts

- **Constitution** (`.specify/memory/constitution.md`): Type safety, layering, no WebSockets/DB/auth, deterministic game rules, test-first discipline.
- **Four feature packages** under `specs/`, each with `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, contracts, and `quickstart.md` (all tasks marked complete).
- **Discovery** ([DISCOVERY.md](./DISCOVERY.md)): Gaps, assumptions, and file inventory for reviewers.
- **Alignment notes** ([IMPLEMENTATION-ALIGNMENT.md](./IMPLEMENTATION-ALIGNMENT.md)): Spec vs code, including intentional deviations.

### Backend (behavior)

| Area | Addition |
|------|----------|
| Lobby | `hostParticipantId`, `POST /start`, join validation, 10-player cap, presence pruning, `lastSeenAt` |
| Round start | `drawing` status, deterministic `secretWord`, drawer/guesser roles |
| Gameplay | `PUT /canvas`, `POST /guesses`, trim + case-insensitive compare, +100/0 scoring, guess history |
| Result | `endRound` on first correct guess, `revealedWord`, reject guesses when round ended |
| Restart | `POST /restart` (host-only), reset scores and round fields, return to `lobby` |
| Tests | 42 Vitest tests (store, API contracts, guess logic, word selection) |

### Frontend (behavior)

| Area | Addition |
|------|----------|
| Session | `sessionStorage` for room code + participant id; hydrate on load |
| Lobby | ~2s polling; host-only start; navigate to game when status is `drawing` |
| Game | `DrawingCanvas` (draw/clear, debounced PUT), `GuessForm`, `GuessHistory`, `Scoreboard`, ~2s poll |
| Results | `ResultPage` at `/results`, shared word/scores/history, host restart, poll → lobby |
| Navigation | Status-driven routing (join → lobby/result/game; game → results; restart → lobby) |

---

## Key technical decisions

1. **Polling-only sync (2s)** — Same pattern for lobby, active game, and result screen. Simple, constitution-compliant, easy to test with two browser tabs; tradeoff is up to ~2s latency vs WebSockets.
2. **Server-authoritative state** — Canvas and guesses are replaced/appended on the server; clients poll `GET /rooms/:code`. Drawer still renders strokes locally for responsiveness, then debounces `PUT`.
3. **Deterministic word pick** — `selectRoundWord(roomCode, roundNumber)` from the seed list avoids randomness in tests and matches constitution.
4. **First correct guess ends round** — Implemented in 004 via `endRound`; further guesses return 409 `"Round has ended"`. Scoring for that guess still applies before transition.
5. **Join during `result`** — Late joiners see the same snapshot (word, scores, history) without replaying the round; join during `drawing` remains blocked.

---

## AI usage (Cursor + Spec Kit)

- **Specify / Plan / Tasks**: Generated and refined feature specs, plans, and ordered tasks per scenario; human review adjusted branch naming (work on `assignment` vs feature branches) and UI polish.
- **Implement**: AI implemented backend and frontend slices per `tasks.md`, with tests written alongside store/API changes.
- **Review discipline**: Constitution checks (no forbidden tech), `npm test` / `npm run build`, and manual two-browser quickstarts before marking phases complete.
- **What I verified manually**: Guest auto-navigate to game when host starts; correct guess → both on results; host restart → both in lobby with scores 0; sidebar layout on game page.

AI accelerated boilerplate (Zod schemas, route wiring, component structure); **game rules and edge cases** were anchored in specs and tests so behavior stayed reviewable.

---

## Tradeoffs & limitations

| Choice | Benefit | Cost |
|--------|---------|------|
| In-memory rooms | Fast lab setup, no infra | State lost on server restart |
| Full canvas PUT (debounced) | Simple server model | Larger payloads than per-stroke events |
| No eraser partial undo | Smaller scope | Clear-only resets canvas |
| Single round per start | Matches README scope | No automatic drawer rotation |
| Polling | No forbidden WebSockets | Visible sync delay (~2s) |

---

## Rubric self-check

| Area | Evidence |
|------|----------|
| Discovery | [DISCOVERY.md](./DISCOVERY.md) |
| Spec Kit artifacts | `.specify/memory/constitution.md`, `specs/001-*` … `specs/004-*` |
| Working game flow | Quickstarts in each feature; README “Verify full game” below |
| Edge cases | Backend tests + Zod; see IMPLEMENTATION-ALIGNMENT.md |
| Implementation alignment | [IMPLEMENTATION-ALIGNMENT.md](./IMPLEMENTATION-ALIGNMENT.md) |
| Reflection | This file |
| Submission clarity | Updated [README.md](./README.md) |

---

## What I would do differently with more time

- Add an automated **multi-browser** or API-level journey test for the full lifecycle (today: manual quickstart + unit/contract tests).
- Extract shared **poll hook** on the frontend to avoid duplicating interval logic across Lobby/Game/Result pages.
- Optional read-only canvas on the result screen for the final drawing (spec allows; not required).
