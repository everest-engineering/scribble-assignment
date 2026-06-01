# Reflection — Scribble Lab

## What did the starter app already have?

The starter shipped a working monorepo with Express and React, room create/join APIs, an in-memory `roomStore`, routing for Start → Create/Join → Lobby → Game, and polished placeholder UI (canvas, guess form, scoreboard, result panel). Multi-player lobby sync worked only via a manual **Refresh Room** button. There was no host role, validation, game start, drawing, guessing, scoring, or restart behavior. Seed words and roles existed in data but were not used in gameplay.

## What did you add?

I added Spec Kit–style artifacts (constitution, four `specs/NNN-*` feature folders, discovery notes, this reflection) and implemented all four business scenarios in one branch:

1. **Lobby** — `hostId`, trimmed name validation, invalid code feedback, ~2s lobby polling, host-only start with a two-player minimum.
2. **Game start** — deterministic word from room code, host as drawer, viewer-filtered `secretWord` in snapshots.
3. **Gameplay** — HTML canvas drawing with stroke sync, guess API with case-insensitive scoring (+100 on correct, round → `result`), game polling.
4. **Restart** — shared result view (`correctWord`, history, scores) and host restart clearing round state while keeping players.

I fixed the frontend API base URL (`/bug` → correct origin) and extended backend tests for host, word visibility, scoring, and restart.

## Spec Kit and AI workflow

Work followed **specify → plan → tasks → implement → validate** per feature group. The constitution constrained polling-only sync and no out-of-scope dependencies. Cursor implemented slices against acceptance criteria; I ran `npm test` and `npm run build` after each major chunk. A separate code-review agent pass was required before opening the PR to upstream.

## Tradeoffs

- **Polling (2s)** instead of WebSockets — simpler and within lab scope; slightly laggy drawing/guess sync.
- **Host always drawer** — satisfies “host or first player” with predictable tests; no rotation.
- **Round ends on first correct guess** — no timer; matches single-round lab scope.
- **Full stroke array on each stroke end** — simple PUT model; fine for small canvases, not optimized for huge drawings.

## What I would do differently

Add integration tests hitting HTTP routes with supertest for join/start/guess flows. Debounce drawing PUTs if stroke frequency becomes an issue. Consider surfacing poll errors in the lobby UI instead of silent catch in `useRoomPolling`.
