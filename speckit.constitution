# Speckit Constitution

## Engineering Principles
1. **TypeScript First**: All new code must be fully typed. Avoid `any`; use `unknown` for dynamic types.
2. **Immutability**: Prefer pure functions and immutable data. Use `structuredClone` for state mutations.
3. **Fail fast**: Validate inputs at API boundaries with Zod. Return clear error messages.
4. **No stateful bloat**: Clean up room state on restart. Keep memory footprint minimal.
5. **No WebSockets**: All sync is via HTTP polling. No Socket.io or real-time push.
6. **No database**: All data is in-memory only.
7. **No authentication**: No accounts, sessions, JWT, or OAuth.
8. **Deterministic game rules**: Word selection must be deterministic (e.g., based on player count). No randomness in gameplay.

## AI Usage Rules
1. **Review all AI output** before committing. Do not trust generated code blindly.
2. **Trace to spec**: Every implementation change must map to a spec acceptance criterion.
3. **No speculative code**: Do not build features outside the spec or out-of-scope items.
4. **Keep the commit trail clean**: Granular, meaningful commits. Each commit should be explainable.

## Review Discipline
1. **Spec → Plan → Tasks → Implement → Validate**: Complete each phase before moving to the next.
2. **Validate with two browsers**: Test all scenarios with two browser tabs before considering a feature group complete.
3. **Build before commit**: Run `npm run build` on both backend and frontend before each commit.
4. **Test existing tests**: Run `npm test` on both sides after changes to ensure no regressions.

## Coding Standards
- File extensions: Use `.js` extension in backend imports (NodeNext resolution).
- Imports: Standard ES module imports. Relative imports within each app.
- Error handling: Use `HttpError` class for API errors. Handle errors in UI without crashing.
- State management: Use the existing `RoomStore` class pattern. Do not add new state libraries.
- Styling: Use existing CSS custom properties and BEM-like naming in `app.css`.
