# Constitution

Rules that govern every decision made during this assignment.
Deviating from these rules requires an explicit note in the commit message.

---

## 1. No Extra Features

Build only what the current scenario requires.
Do not add fields, endpoints, components, or behavior that are not demanded by the acceptance criteria being worked on.
Out-of-scope items listed in the README (WebSockets, timers, multiple rounds, auth, etc.) are permanently off the table.
If something seems useful but is not in the spec, write it down as a future note — do not build it.

## 2. Test Before Commit

Every commit must leave the test suite passing.
Run `npm test` in both `backend/` and `frontend/` before staging.
Run `npm run build` in both directories to confirm there are no type errors.
If a change breaks an existing test, fix the test or fix the code — do not skip or delete the test.
New logic that can be unit tested (validation, scoring, snapshot filtering) must have a test before the code is committed.

## 3. Small Commits

Each commit should cover exactly one logical change: a model update, a single endpoint, a single component, a state action, or a test.
A commit that touches both backend and frontend is a signal to split it.
Commit messages must state what changed and why in plain language.
Large "everything works now" commits are not acceptable.

## 4. Review AI-Generated Code

Never commit AI-generated code without reading it line by line first.
Verify that the code matches the spec, not just that it looks reasonable.
Check for: invented fields or endpoints not in the plan, silent error suppression, logic that differs from acceptance criteria, and unnecessary abstractions.
If the AI output requires more than minor edits to be correct, treat the output as a draft and rewrite the relevant parts before committing.
