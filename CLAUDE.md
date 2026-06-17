<!-- SPECKIT START -->
Active feature: Gameplay Interaction (Feature Group 3 of 4). Builds on Groups 1 & 2.
Current plan: specs/003-gameplay-interaction/plan.md
Spec: specs/003-gameplay-interaction/spec.md | Contracts: specs/003-gameplay-interaction/contracts/rooms-api.md
Done: Group 1 (specs/001-room-setup-lobby/) host/polling/start; Group 2 (specs/002-game-start-drawer/) name validation, drawer, deterministic word, drawer-only word.

Stack: brownfield web app — Express + Zod backend (in-memory room store, no DB), React 18 +
React Router frontend with a useSyncExternalStore room store. Sync is polling-only (~2s); no
WebSockets, no auth, no new dependencies. Extend existing files; do not rewrite.

For full context (state model, data flow, file-level changes), read the current plan above.
<!-- SPECKIT END -->
