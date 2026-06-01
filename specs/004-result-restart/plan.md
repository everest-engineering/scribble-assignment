# Plan 004 — Result, Restart & Final Validation

## State model

- On correct guess: `status = "result"`, snapshot includes `correctWord` for all viewers
- `restartGame`: reset to lobby, `hostId` unchanged, participants kept, `score = 0`, clear `guesses`, `strokes`, `secretWord`, `drawerId`, roles null

## API

- `POST /rooms/:code/restart` — host only, result only

## Frontend

- Result banner on GamePage when `status === "result"`
- Host Restart button → API → navigate `/lobby`
- Lobby polling after restart for guests

## Testing

- restart clears round fields but keeps participant ids
- integration-style roomStore test: play → result → restart → lobby

## Risks

Clients stuck on game screen if polling stops — ensure lobby route poll or game poll detects `lobby` and navigates.

## Navigation matrix

| Event | Host UI | Guest UI |
|-------|---------|----------|
| Start game | POST start → `/game` | Poll sees `playing` → `/game` |
| Correct guess | Poll sees `result` | Poll sees `result` |
| Restart | POST restart → `/lobby` | Poll sees `lobby` → `/lobby` |
