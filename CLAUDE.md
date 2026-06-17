<!-- SPECKIT START -->
Active feature: Game Start & Drawer Flow (Feature Group 2 of 4). Builds on Group 1.
Current plan: specs/002-game-start-drawer/plan.md
Spec: specs/002-game-start-drawer/spec.md | Contracts: specs/002-game-start-drawer/contracts/rooms-api.md
Group 1 (done): specs/001-room-setup-lobby/ — host identity, ~2s polling, host-only start, auto-advance.

Stack: brownfield web app — Express + Zod backend (in-memory room store, no DB), React 18 +
React Router frontend with a useSyncExternalStore room store. Sync is polling-only (~2s); no
WebSockets, no auth, no new dependencies. Extend existing files; do not rewrite.

For full context (state model, data flow, file-level changes), read the current plan above.
<!-- SPECKIT END -->
