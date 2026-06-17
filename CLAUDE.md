<!-- SPECKIT START -->
Active feature: Room Setup & Lobby (Feature Group 1 of 4).
Current plan: specs/001-room-setup-lobby/plan.md
Spec: specs/001-room-setup-lobby/spec.md | Contracts: specs/001-room-setup-lobby/contracts/rooms-api.md

Stack: brownfield web app — Express + Zod backend (in-memory room store, no DB), React 18 +
React Router frontend with a useSyncExternalStore room store. Sync is polling-only (~2s); no
WebSockets, no auth, no new dependencies. Extend existing files; do not rewrite.

For full context (state model, data flow, file-level changes), read the current plan above.
<!-- SPECKIT END -->
