<!-- SPECKIT START -->
Active feature: Result, Restart & Final Validation (Feature Group 4 of 4 — final). Builds on Groups 1–3.
Current plan: specs/004-result-restart/plan.md
Spec: specs/004-result-restart/spec.md | Contracts: specs/004-result-restart/contracts/rooms-api.md
Done: Group 1 (001-room-setup-lobby) host/polling/start; Group 2 (002-game-start-drawer) name validation, drawer, deterministic word, drawer-only word; Group 3 (003-gameplay-interaction) canvas, guesses, synced history, scoring.

Stack: brownfield web app — Express + Zod backend (in-memory room store, no DB), React 18 +
React Router frontend with a useSyncExternalStore room store. Sync is polling-only (~2s); no
WebSockets, no auth, no new dependencies. Extend existing files; do not rewrite.

For full context (state model, data flow, file-level changes), read the current plan above.
<!-- SPECKIT END -->
