# Quickstart — Scenario 4 (Result, Restart & Final Validation)

**Feature**: `004-result-restart`

Two-tab walkthrough that exercises every FR in `spec.md` against the running dev servers. Each scenario lists the **expected** observable outcome plus the **curl** variant for direct API verification.

---

## Prerequisites

```bash
# Tab A — backend
cd backend && npm install && npm run dev
# Tab B — frontend
cd frontend && npm install && npm run dev
```

- Backend: `http://localhost:3001` (`GET /health` → `{"ok":true}`)
- Frontend: `http://localhost:5173`

You also need the room from features 001–003 to be set up. Quick-create with `curl`:

```bash
# Create a room as Alice (host)
CREATE=$(curl -s -X POST http://localhost:3001/rooms \
  -H 'Content-Type: application/json' \
  -d '{"playerName":"Alice"}')
ROOM=$(echo "$CREATE"  | jq -r '.room.code')
ALICE=$(echo "$CREATE" | jq -r '.participantId')

# Join as Bob
JOIN=$(curl -s -X POST "http://localhost:3001/rooms/$ROOM/join" \
  -H 'Content-Type: application/json' \
  -d '{"playerName":"Bob"}')
BOB=$(echo "$JOIN" | jq -r '.participantId')

# Start the round (Alice is drawer, word is "rocket")
curl -s -X POST "http://localhost:3001/rooms/$ROOM/start" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}" > /dev/null

# Bob submits one wrong + one correct guess
curl -s -X POST "http://localhost:3001/rooms/$ROOM/guesses" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$BOB\",\"text\":\"cat\"}" > /dev/null
curl -s -X POST "http://localhost:3001/rooms/$ROOM/guesses" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$BOB\",\"text\":\"rocket\"}" > /dev/null

echo "ROOM=$ROOM  ALICE=$ALICE  BOB=$BOB"
```

The room is now in `status=round`, Alice is the drawer, Bob has scored 100 and is locked out, the guess feed has 2 entries. **Use these env vars in every scenario below.**

In the browser, open two tabs:

- **Tab 1 (Alice)**: navigate to `http://localhost:5173`, click *Reconnect to room* (or visit `/lobby/$ROOM` directly after setting `sessionStorage.scribble.participantId=$ALICE` in DevTools). You should see the drawer view with the word `ROCKET`.
- **Tab 2 (Bob)**: open a different browser **profile or private window** to keep `sessionStorage` separate. Navigate to `/lobby/$ROOM` with `sessionStorage.scribble.participantId=$BOB`. You should see the guesser view (mask `______`) and the lockout line *"You already guessed correctly this round."*

---

## Scenario 1 — End Round reveals the word to everyone (US1, FR-001…004, FR-007…010)

1. In **Tab 1** (Alice, the host **and** the drawer): the round panel shows `Round 1`, the cleartext word `ROCKET`, the scoreboard `Alice 0 — Bob 100`, and a new **End Round** button.
2. In **Tab 2** (Bob): no End Round button is visible.
3. In Tab 1, click **End Round**.
4. **Expected** within ≤ 2 seconds:
   - **Both tabs** show a **Result view** with a banner *"Round 1 ended — the word was ROCKET"*.
   - **Both tabs** show the final scoreboard `Alice 0 — Bob 100`.
   - **Both tabs** show the chronological guess feed (`Bob — cat — Wrong`, `Bob — rocket — Correct`).
   - **Both tabs** have **no** guess input.
   - **Bob's tab now sees** the cleartext word `ROCKET` (the reveal).
   - **Alice's tab** sees a new **Restart** button. Bob's tab does **not**.

Curl variants:

```bash
# End the round (Alice is host)
curl -i -X POST "http://localhost:3001/rooms/$ROOM/end" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}"
# → 200, room.status === "result", round.secretWord === "rocket"

# Bob's poll now contains the cleartext word
curl -s "http://localhost:3001/rooms/$ROOM?participantId=$BOB" | jq '.room.round.secretWord'
# → "rocket"

# A guess submitted during result is rejected with 409
curl -i -X POST "http://localhost:3001/rooms/$ROOM/guesses" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$BOB\",\"text\":\"anything\"}"
# → 409 { "message": "No round in progress" }

# Non-host cannot end (already in result, but the host check happens before the status check)
curl -i -X POST "http://localhost:3001/rooms/$ROOM/end" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$BOB\"}"
# → 403 { "message": "Only the host can end the round" }

# Idempotent re-end by the host (room is already in "result")
curl -i -X POST "http://localhost:3001/rooms/$ROOM/end" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}"
# → 200, room.status === "result", same body as the first 200 (FR-007)
```

---

## Scenario 2 — Host Restart returns everyone to the lobby (US2, FR-005…008, FR-010)

> Requires Scenario 1 to have completed (room is in `"result"`).

1. In **Tab 1** (Alice): the **Restart** button is visible.
2. In **Tab 2** (Bob): **no** Restart button is visible.
3. In Tab 1, click **Restart**.
4. **Expected** within ≤ 2 seconds:
   - **Both tabs** show the **lobby** view (no round panel, no scoreboard, no banner).
   - **Both tabs** show the same participant list as before: `Alice (host)`, `Bob` — same IDs, same order.
   - **Tab 1** shows the **Start Game** button again (because there are still ≥ 2 participants).
   - **Tab 2** does **not** show a Start Game button.
5. In Tab 1, click **Start Game**.
6. **Expected**: the room transitions to `"round"` (per feature 002). Verify that scores are `{Alice: 0, Bob: 0}` and the guess feed is empty (no carry-over from the previous round).

Curl variants:

```bash
# Host restart
curl -i -X POST "http://localhost:3001/rooms/$ROOM/restart" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}"
# → 200, room.status === "lobby", room.round === null, participants unchanged

# Bob's poll now sees the lobby
curl -s "http://localhost:3001/rooms/$ROOM?participantId=$BOB" | jq '.room | {status, round}'
# → { "status": "lobby", "round": null }

# Non-host cannot restart
curl -i -X POST "http://localhost:3001/rooms/$ROOM/restart" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$BOB\"}"
# → 403 { "message": "Only the host can restart the room" }

# Idempotent re-restart by the host (room is already in "lobby")
curl -i -X POST "http://localhost:3001/rooms/$ROOM/restart" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}"
# → 200, same body as the first 200 (FR-007)

# Restart-then-start: scores reset, feed empty
curl -s -X POST "http://localhost:3001/rooms/$ROOM/start" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}" | jq '.room.round | {guesses, scores}'
# → { "guesses": [], "scores": { "<alice-id>": 0, "<bob-id>": 0 } }   (SC-005)
```

---

## Scenario 3 — Invalid transitions (edge cases)

```bash
# End Round while still in "lobby" (i.e. before Start)
# Reset the room first by restarting if needed; then:
curl -i -X POST "http://localhost:3001/rooms/$ROOM/end" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}"
# → 409 { "message": "No active round to end" }

# Restart while still in "round" (start fresh and don't end)
curl -s -X POST "http://localhost:3001/rooms/$ROOM/start" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}" > /dev/null
curl -i -X POST "http://localhost:3001/rooms/$ROOM/restart" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}"
# → 409 { "message": "End the active round before restarting" }

# Unknown room
curl -i -X POST "http://localhost:3001/rooms/ZZZZ/end" \
  -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}"
# → 404 { "message": "Room not found" }

# Empty participantId on either endpoint
curl -i -X POST "http://localhost:3001/rooms/$ROOM/end" \
  -H 'Content-Type: application/json' \
  -d '{"participantId":""}'
# → 400 { "message": "Invalid request" }
```

---

## Acceptance checklist (manual)

Tick each item after walking through the scenarios above. **Every** item must pass before declaring the feature complete.

- [ ] **FR-001** Room exposes three valid statuses `"lobby" | "round" | "result"`; transitions follow the state diagram in `data-model.md`.
- [ ] **FR-002** End Round endpoint: 200 (host, `"round"`), 200 idempotent (host, `"result"`), 403 (non-host), 404 (unknown room), 409 (`"lobby"`).
- [ ] **FR-003** In `"result"`, every viewer (drawer, guesser, anonymous) sees `secretWord` in their poll body.
- [ ] **FR-004** Guess submission during `"result"` returns 409 `"No round in progress"`; feed and scores unchanged.
- [ ] **FR-005** Restart endpoint: 200 (host, `"result"`), 200 idempotent (host, `"lobby"`), 403 (non-host), 404 (unknown room), 409 (`"round"`).
- [ ] **FR-006** After Restart: `round === null`, participants array byte-identical (incl. `hostParticipantId`), every `isDrawer` is `false`.
- [ ] **FR-007** Idempotency verified by sending each terminal-state call twice and confirming the second body equals the first.
- [ ] **FR-008** End Round and Restart transitions are visible in the other tab within ≤ 2 s in 9 of 10 trials.
- [ ] **FR-009** Result view shows banner + cleartext word + scoreboard + read-only feed; no canvas, no input, no Start.
- [ ] **FR-010** End Round button visible only to the host during `"round"`; Restart button visible only to the host during `"result"`. Non-hosts never see either.
- [ ] **SC-005** A restart-then-start cycle produces a brand-new round with `guesses: []` and all scores at `0`.

---

## Reset (return the room to a clean lobby for re-testing)

```bash
# If still in "round", end + restart:
curl -s -X POST "http://localhost:3001/rooms/$ROOM/end"     -H 'Content-Type: application/json' -d "{\"participantId\":\"$ALICE\"}" > /dev/null
curl -s -X POST "http://localhost:3001/rooms/$ROOM/restart" -H 'Content-Type: application/json' -d "{\"participantId\":\"$ALICE\"}" > /dev/null
# If in "result", just restart:
curl -s -X POST "http://localhost:3001/rooms/$ROOM/restart" -H 'Content-Type: application/json' -d "{\"participantId\":\"$ALICE\"}" > /dev/null
# Verify
curl -s "http://localhost:3001/rooms/$ROOM" | jq '.room | {status, round}'
# → { "status": "lobby", "round": null }
```
