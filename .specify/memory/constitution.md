# Constitution — Scribble Game Development

## Engineering Principles

1. **Extend, don't replace.** Never rewrite existing files from scratch. Add to existing structures, models, and components.
2. **TypeScript First.** All new code must be fully typed. Avoid `any`; use `unknown` for truly dynamic types.
3. **Deterministic game rules.** All game logic (word selection, scoring, drawer assignment) must be deterministic — no randomness.
4. **Fail fast and gracefully.** Backend errors return structured JSON with appropriate HTTP status codes. Frontend errors display user-friendly messages without crashing the UI.
5. **Immutability.** Treat state as immutable. Use spread/rest patterns, not mutations.
6. **Minimal surface area.** Add only the fields, endpoints, and components needed to satisfy the spec. No speculative generality.
7. **No new dependencies.** Do not add npm packages beyond what the starter ships.

## AI Usage Rules

1. **Spec before code.** Always write/update the spec, plan, and tasks before writing code for a feature group.
2. **One feature group at a time.** Implement in order: Room Setup → Game Start → Gameplay → Result/Restart. Validate each before moving on.
3. **Traceability.** Every commit must be traceable to a specific task in tasks.md and a specific acceptance criterion in spec.md.
4. **No secret generation.** AI must not generate credentials, API keys, or security-sensitive values.
5. **Ask when ambiguous.** If a spec requirement is unclear, ask the user before assuming.

## Review Discipline

1. **Self-review before committing.** Read every diff before staging. Verify: does the code match the spec? Are there unused variables or dead code? Are types correct?
2. **Run tests after each feature group.** `npm test` in both backend and frontend must pass.
3. **Build before commit.** Run `npm run build` in both backend and frontend before any commit.
4. **Manual two-browser test.** After each feature group, verify the flow with two browser tabs.
5. **Document deviations.** If implementation must deviate from the spec, update the spec to reflect reality and note the reason.

## Out-of-Scope Enforcement

The following must never appear in code or artifacts:
- WebSockets, Socket.io, or any real-time push protocol
- Databases, SQLite, or file-based persistence
- Authentication, sessions, JWT, or OAuth
- Multiple rounds, drawer rotation, timers, or countdowns
- Custom word packs or random word selection
- Spectator mode, kick/mute, room passwords
- New state-management or routing libraries
- Docker, CI/CD, or deployment configuration
