# Quickstart: Gameplay Interaction Validation

## Prerequisites

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Automated checks

```bash
cd backend && npm test && npm run build
cd frontend && npm test && npm run build
node .github/scripts/pre-evaluation-check.mjs
```

## Two-tab manual scenario

### Setup

1. Tab A (Alice): create room; Tab B (Bob): join
2. Alice starts game — both on game page, scores all **0**

### Drawing

3. Alice draws on canvas — Bob sees strokes within ~3 s
4. Alice clicks **Clear** — both see empty canvas
5. Bob cannot draw (no pointer capture / API 403 if forced)

### Guessing

6. Bob submits wrong guess `"test"` — appears in history both tabs; scores unchanged
7. Bob submits correct guess (case variant OK) — Bob **+100**, status **result**, guess form disabled
8. Bob tries another guess — rejected

### Result state

9. Both tabs show scores and full guess history
10. Secret word still hidden from Bob (Scenario 2 rule); full reveal is Scenario 4

## Cap smoke (optional)

- Send 501st stroke via test → 409
- Send 201st guess via test → 409
