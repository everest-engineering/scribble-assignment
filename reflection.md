# Scribble Lab Reflection

## Overview

This reflection documents the AI-assisted Spec Kit workflow used to complete all four README business scenarios for the Scribble multiplayer drawing game lab. Each scenario was specified, clarified, planned, task-decomposed, and implemented incrementally on the brownfield Express + React starter.

## Scenario Summaries

### Scenario 1 — Room setup and lobby

The starter lacked host tracking, name validation, automatic polling, and had a planted `/bug` API URL default. Spec Kit artifacts locked assumptions A5 (2000 ms polling) and A6 (name length). Implementation added `hostParticipantId`, Zod-trimmed names, `useRoomPolling`, and fixed the API base URL. AI drafting was accurate for Express route structure but initially suggested WebSocket sync — rejected per constitution.

### Scenario 2 — Game start and drawer

Gap G5–G7 required `playing` status, `startRound`, and snapshot word masking. The constitution's snapshot purity principle was critical: `toRoomSnapshot` must branch on viewer identity. AI generated correct Zod schemas on first pass; the host-only start button needed manual review to wire the backend call instead of blind navigation.

### Scenario 3 — Gameplay interaction

Canvas drawing, guess submission, scoring, and result transition on first correct guess (A3). AI proposed SVG rendering — rejected in favor of 600×400 canvas per Q3. Stroke caps and point decimation were added per constitution IV. Tests caught a regression where guess history omitted participant names.

### Scenario 4 — Result and restart

Final scenario reveals the secret word to all players in result state (constitutional exception to drawer-only masking), shows full guess history and scores, and adds host-only `POST /restart` returning to lobby with participants preserved and round state cleared (A4). Frontend Play Again triggers restart and navigates host; guests poll-detect lobby return within one cycle.

## AI Usage Patterns

- **Strengths**: Rapid spec/plan/task generation from discovery.md IDs; consistent file-path targeting; Vitest test scaffolding matching existing patterns.
- **Rewrites**: WebSocket suggestions (all scenarios); over-engineered stroke delta sync (Scenario 3); separate `revealedWord` field instead of snapshot branch (Scenario 4).
- **Workflow**: Constitution-first prompting reduced rework. Running `pre-evaluation-check.mjs` after each scenario caught forbidden-tech false positives early.

## Tradeoffs

| Decision | Choice | Alternative rejected |
|----------|--------|---------------------|
| Sync model | HTTP polling 2 s | WebSockets (forbidden) |
| Word reveal | Snapshot branch at result | Client-side guess inference |
| Restart | Delete `currentRound` | Keep history in lobby |
| Scores on restart | Reset to none (A4) | Persist leaderboard |
| Drawer rotation | Same first participant (Q2) | Round-robin |

## Conclusion

Spec Kit's phased pipeline (specify → clarify → plan → tasks → implement) kept each scenario independently testable and aligned with the constitution. The highest-value human review points were snapshot serialization, host-only permissions, and two-tab manual validation before closing each scenario's last task.
