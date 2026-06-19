<!-- SPECKIT START -->
Active feature: increment 005-auto-end-round — a correct guess auto-ends the round to the result state (refines Groups 3/4).
Current plan: specs/005-auto-end-round/plan.md
Spec: specs/005-auto-end-round/spec.md | Contracts: specs/005-auto-end-round/contracts/rooms-api.md
Done: Groups 1–4 (001-room-setup-lobby, 002-game-start-drawer, 003-gameplay-interaction, 004-result-restart) — full lobby→active→result→restart loop with host-only End Round; this increment adds auto-end on a correct guess (host End Round kept as fallback).

Stack: brownfield web app — Express + Zod backend (in-memory room store, no DB), React 18 +
React Router frontend with a useSyncExternalStore room store. Sync is polling-only (~2s); no
WebSockets, no auth, no new dependencies. Extend existing files; do not rewrite.

For full context (state model, data flow, file-level changes), read the current plan above.
<!-- SPECKIT END -->
