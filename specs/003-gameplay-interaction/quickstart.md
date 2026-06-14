# Quickstart — Gameplay Interaction

A runnable validation guide. Every scenario below is reproducible against a freshly started `npm run dev` in both `backend/` and `frontend/`.

## Prerequisites

```bash
cd backend && npm install && npm run dev
# in a separate terminal
cd frontend && npm install && npm run dev
```

Backend at `http://localhost:3001`. Frontend at `http://localhost:5173`.

Two browser windows / private windows are needed (`Tab 1` and `Tab 2` below). For curl-only checks, capture the participant ids and the room code from the create/join responses:

```bash
ROOM=$(curl -s -X POST http://localhost:3001/rooms -H 'Content-Type: application/json' \
  -d '{"playerName":"Alice"}' | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d["room"]["code"])')
ALICE=$(curl -s "http://localhost:3001/rooms/$ROOM" | python3 -c 'import json,sys;print(json.load(sys.stdin)["room"]["hostParticipantId"])')
BOB=$(curl -s -X POST "http://localhost:3001/rooms/$ROOM/join" -H 'Content-Type: application/json' \
  -d '{"playerName":"Bob"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["participantId"])')
curl -s -X POST "http://localhost:3001/rooms/$ROOM/start" -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\"}" > /dev/null
echo "ROOM=$ROOM ALICE=$ALICE BOB=$BOB"
```

After the four commands above, the room is in `status=round`, Alice is the drawer (secret word `rocket`), Bob is the only guesser. **Use these env vars in every scenario below.**

---

## Scenario 1 — Submit a guess and see it in everyone's feed (US1, FR-001…007)

1. In **Tab 1** (Alice): the round panel shows `Round 1`, the cleartext word `ROCKET`, and a scoreboard with `Alice 0 — Bob 0`. There is **no** guess input on Alice's tab.
2. In **Tab 2** (Bob): the round panel shows `Round 1`, the masked word `______`, the same scoreboard, and a guess input.
3. In Tab 2, type `cat` and press **Submit**.
4. **Expected**: within ≤ 2 seconds **both** tabs show a feed entry: `Bob — cat — Wrong`. Scores are still `0 — 0`. Bob's input is re-enabled (Bob is not locked out).
5. Repeat with `  RoCkEt  ` from Tab 2.
6. **Expected**: within ≤ 2 seconds both tabs show a new feed entry: `Bob — RoCkEt — Correct`. Scores become `Alice 0 — Bob 100`. Bob's input is now **disabled** with the label *"You already guessed correctly this round."*

Curl variants:

```bash
# Wrong guess
curl -i -X POST "http://localhost:3001/rooms/$ROOM/guesses" -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$BOB\",\"text\":\"cat\"}"
# → 200, response body shows guesses[0].isCorrect=false, scores unchanged

# Correct guess
curl -i -X POST "http://localhost:3001/rooms/$ROOM/guesses" -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$BOB\",\"text\":\"  Rocket  \"}"
# → 200, response body shows guesses[1].isCorrect=true, scores.<bob>=100, lockedParticipantIds=[<bob>]

# Locked-out follow-up
curl -i -X POST "http://localhost:3001/rooms/$ROOM/guesses" -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$BOB\",\"text\":\"again\"}"
# → 409 {"message":"You have already guessed correctly this round"}
```

---

## Scenario 2 — Negative cases (FR-002, FR-004)

| Input | Expected status | Expected message substring |
|---|---|---|
| `text: ""` (empty) | `400` | validation message |
| `text: "    "` (whitespace only — trims to empty) | `400` | validation message |
| `text` length 51 | `400` | validation message |
| Missing `participantId` | `400` | validation message |
| Drawer submits a guess (`participantId=$ALICE`) | `403` | `Drawers cannot guess in their own round` |
| Unknown `participantId` (random uuid) | `403` | `Participant is not in the room` |
| Unknown room `ZZZZ` | `404` | `Room not found` |

Spot-check one:

```bash
curl -i -X POST "http://localhost:3001/rooms/$ROOM/guesses" -H 'Content-Type: application/json' \
  -d "{\"participantId\":\"$ALICE\",\"text\":\"rocket\"}"
# → 403 {"message":"Drawers cannot guess in their own round"}
```

---

## Scenario 3 — Secret-word visibility guard (US1 + feature 002 carry-over, FR-006, SC-004)

1. Fresh room. Alice + Bob. Round started. Bob submits **5 wrong guesses** (`cat`, `dog`, `sun`, `mug`, `pen`).
2. Poll the room as **Bob 10 times in a row** and capture each response body:

   ```bash
   for i in {1..10}; do
     curl -s "http://localhost:3001/rooms/$ROOM?participantId=$BOB" >> /tmp/guesser-polls.json
     echo "" >> /tmp/guesser-polls.json
   done
   grep -c 'rocket' /tmp/guesser-polls.json
   ```

3. **Expected**: `0` matches of the literal string `rocket` across all 10 polls (it appears in `availableWords` only in the lobby, and we are in-round). All 5 guesses appear in every payload.
4. Poll the same room **as Alice once**:

   ```bash
   curl -s "http://localhost:3001/rooms/$ROOM?participantId=$ALICE" | grep -o '"secretWord":"rocket"'
   ```

5. **Expected**: exactly one match. The drawer's payload still includes the cleartext word.

---

## Scenario 4 — Scoring (US2, FR-005, FR-009)

1. Fresh room. Alice + Bob + Carol (Carol joins via `POST /rooms/$ROOM/join`). Round started.
2. Initial scoreboard: `Alice 0 — Bob 0 — Carol 0` (in all three tabs).
3. Bob submits a correct guess → `Alice 0 — Bob 100 — Carol 0` everywhere within ≤ 2s.
4. Carol submits a correct guess → `Alice 0 — Bob 100 — Carol 100` everywhere within ≤ 2s.
5. Alice attempts a guess → `403` (drawer); scoreboard unchanged.
6. Bob attempts a second guess (correct or otherwise) → `409`; scoreboard unchanged.

---

## Scenario 5 — Drawer canvas (US3, FR-010)

1. In Tab 1 (Alice / drawer), the canvas is mounted below the cleartext word panel. The Clear button is visible.
2. Drag the mouse across the canvas — a freehand stroke appears.
3. Click **Clear** — the canvas is empty.
4. In Tab 2 (Bob / guesser), there is **no canvas** rendered. Only a placeholder line: *"Waiting for the drawer…"*
5. Refresh Tab 1 (Alice). The canvas is empty (no persistence). The cleartext word is still `ROCKET`. The scoreboard and feed are still synced.

Network check (canvas drawing must NOT issue a request):

```bash
# Open DevTools → Network in Tab 1, draw for 5 seconds, click Clear.
# Expected: only the ~2s GET /rooms/$ROOM polls appear. No POSTs.
```

---

## Scenario 6 — Two-tab manual happy-path (full feature 003)

1. Tab 1: create as `Alice`. Tab 2: join as `Bob`. Click **Start Game** in Tab 1.
2. Tab 1 should show: round panel, drawer badge on Alice, cleartext `ROCKET`, scoreboard `0/0`, canvas, **no** guess input.
3. Tab 2 should show: round panel, drawer badge on Alice, masked `______`, scoreboard `0/0`, guess input, **no** canvas.
4. Type `dog` in Tab 2 → both feeds show `Bob — dog — Wrong`. Both scoreboards still `0/0`.
5. Type `Rocket` in Tab 2 → both feeds show `Bob — Rocket — Correct`. Both scoreboards show `Alice 0 — Bob 100`. Tab 2's input is now disabled.
6. Tab 1 (Alice): draw a stroke, then click Clear. Verify nothing about Tab 2 changes.

**Done** when all six scenarios pass without regressing the feature 001 + 002 quickstarts.

---

## Negative-test summary table (copy-paste-friendly)

| Scenario | Endpoint | Expectation |
|---|---|---|
| Empty `text` | `POST /rooms/$ROOM/guesses` | `400` |
| `text` > 50 chars | `POST /rooms/$ROOM/guesses` | `400` |
| Drawer guesses | `POST /rooms/$ROOM/guesses` (`$ALICE`) | `403` |
| Unknown participant | `POST /rooms/$ROOM/guesses` (`fake-uuid`) | `403` |
| Unknown room | `POST /rooms/ZZZZ/guesses` | `404` |
| Lobby (no round) | `POST /rooms/<lobby>/guesses` | `409` |
| Already-correct guesser | `POST /rooms/$ROOM/guesses` (`$BOB` after correct) | `409` |
| Secret word in guesser payload (wrong-guesses only) | `GET /rooms/$ROOM?participantId=$BOB` | string `"rocket"` absent |
| Secret word in drawer payload | `GET /rooms/$ROOM?participantId=$ALICE` | `"secretWord":"rocket"` present |
