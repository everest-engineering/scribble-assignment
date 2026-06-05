# Data Model: Result, Restart & Final Validation

**Feature**: 004-result-restart — Scenario 4
**Date**: 2026-06-05

---

## RoomStatus (extended)

```
"lobby" | "active" | "result"
```

*Change from Scenario 3*: adds `"result"`.

- `"lobby"` — waiting for players; host can start.
- `"active"` — game in progress; drawer draws, guessers guess.
- `"result"` — round ended; all players see results; host can restart.

---

## Room (no new fields)

No new fields are added. The existing fields already carry all necessary result data:

| Field           | On End Round      | On Restart           |
|-----------------|-------------------|----------------------|
| `status`        | `"result"`        | `"lobby"`            |
| `currentWord`   | unchanged         | `undefined` / cleared |
| `drawerId`      | unchanged         | `undefined` / cleared |
| `canvasStrokes` | unchanged         | `[]`                 |
| `guesses`       | unchanged         | `[]`                 |
| `scores`        | unchanged         | `undefined` / cleared |
| `participants`  | unchanged         | unchanged (preserved) |
| `hostId`        | unchanged         | unchanged (preserved) |

---

## State Transitions (full lifecycle)

```
[create room]
     │
     ▼
  "lobby"  ◄──── [players join] ◄──── [restart]
     │                                     ▲
     │  [host starts game]                 │
     ▼                                     │
  "active"                                 │
     │                                     │
     │  [host ends round]                  │
     ▼                                     │
  "result"  ──── [host restarts] ──────────┘
```

---

## RoomSnapshot (no new fields)

The `currentWord` (already optionally present for the drawer during "active") is now
also visible in the `"result"` state because filtering is only applied during the active
round. The updated `toRoomSnapshot` rule:

- During `"active"`: include `currentWord` only when `viewerParticipantId === drawerId`
- During `"result"`: include `currentWord` for all viewers (the secret is now revealed)

This single-line change to `toRoomSnapshot` enables the result screen to display the
word without any new fields.

---

## Frontend Routing

New route added to `frontend/src/routes/index.tsx`:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/result` | `ResultPage` | Post-round result screen |

Navigation flow:
- `GamePage` polling: `status === "result"` → `navigate("/result")`
- `ResultPage` polling: `status === "lobby"` → `navigate("/lobby")`
