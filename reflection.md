# Reflection

## Project Overview

Scribble is a multiplayer drawing game (Pictionary-style) built with an Express + TypeScript backend and React 18 + Vite frontend. All state is in-memory, synced via HTTP polling. No WebSockets, no databases, no authentication.

## What Went Well

The Spec → Plan → Tasks → Implement → Validate workflow provided clear structure for incremental delivery. Each feature group had well-defined boundaries, making it easy to parallelize backend and frontend work where possible.

The typed discriminated union pattern (`{ ok: true, room } | { ok: false, status, message }`) for service function returns made error handling consistent across all routes. Zod schemas at the API boundary ensured clean validation without leaking to business logic.

The `toRoomSnapshot` function with viewer-relative secret word visibility (`isDrawer || status === "result"`) encapsulated the security rules in one place rather than spreading them across routes.

## Challenges

The pre-evaluation artifact layout differs from the `.specify/` directory structure used during development — the script expects `specs/NNN-name/{spec,plan,tasks}.md` but files were organized as flat `.specify/{specs,plans,tasks}/NNN-name.md`. This required a bridge layer (symlinks) to satisfy both conventions.

## Key Decisions

- Host is always the drawer (no rotation) — simplifies state and avoids needing multi-round logic
- Manual round end (no timer, no auto-end on correct guess) — keeps the host in control
- Canvas is purely local — avoids the complexity of stroke serialization and sync for a demo
- Scores are round-scoped and cleared on restart — no cumulative leaderboard complexity
- Secret word is deterministic (always `STARTER_WORDS[0]`) — predictable for testing

## What I'd Do Differently

For a production version, I'd add drawer rotation, a word bank with random selection, and proper canvas sync (via the polling mechanism or a shared stroke log). The restart flow could also offer a "new round" shortcut instead of returning to lobby.
