# Clarification: Gameplay Interaction

**Date**: 2026-06-26

## Questions & Answers

### Q1: Drawing Architecture
- **Question**: FR-022 says "persist drawing strokes server-side." Should strokes be stored server-side or client-only?
- **Answer**: **Server-side stroke storage** — POST/DELETE endpoints for strokes, fetched via polling.

### Q2: Post-Correct-Guess Flow
- **Question**: When a correct guess ends the round, does the game auto-advance or wait for user action?
- **Answer**: **Auto-advance to next round** — Server immediately increments `currentRound`, shows a brief score card, picks new drawer+word, and resets drawing. Polling shows the new round state.

### Q3: Guess Feedback Timing
- **Question**: Should guess POST response include result directly, or rely on polling?
- **Answer**: **Response includes result** — POST returns `{ correct: boolean, message: string }` for instant feedback.

### Q4: Score Model
- **Question**: Should scores be cumulative-only or track per-round + cumulative?
- **Answer**: **Round + cumulative** — Track both per-round score and cumulative total.
