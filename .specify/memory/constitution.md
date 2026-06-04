# Constitution

## Engineering Principles
- **Extend, don't replace**: All changes must build upon the existing codebase structure. No files should be rewritten from scratch unless explicitly required.
- **TypeScript first**: Every new function, variable, and parameter must have explicit types. Avoid `any`.
- **Immutable operations**: Room state mutations must use `structuredClone` or spread operators. Do not mutate objects in place.
- **Fail fast**: Invalid inputs (empty names, bad room codes, wrong participant) must be rejected with clear error messages at the earliest point.
- **No over-engineering**: Build only what the spec requires. No extra features, no premature optimization.

## AI Usage Rules
- The AI must not introduce WebSockets, databases, authentication, or any out-of-scope technology.
- The AI must explain all generated code changes and how they map to the spec.
- The AI must not refactor unrelated code or add dependencies beyond what the spec justifies.
- The AI must run tests before and after changes to verify nothing is broken.

## Review Discipline
- Every AI-generated change must be reviewed for correctness, type safety, and spec alignment before being committed.
- Changes must be traceable to specific acceptance criteria in the spec.
- Any deviation from the spec must be documented with justification.
