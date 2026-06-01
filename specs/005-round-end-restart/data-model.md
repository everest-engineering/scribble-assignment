# data-model.md — Round End Restart

## Entities

- Player
  - id: string (unique)
  - name: string
  - score: number
  - status: enum (connected, disconnected, left)

- Room
  - id / code: string
  - players: Player[]
  - lobbyState: object
  - lastRoundSummary: RoundSummary | null

- RoundSummary
  - roundId: string
  - correctWord: string
  - finalScores: { playerId: string; score: number }[]
  - guessHistory: { playerId: string; guess: string; correct: boolean; timestamp: string }[]
  - drawerId: string

## Validation Rules

- Player.score MUST be integer >= 0
- RoundSummary.guessHistory entries MUST include timestamp and player reference
- Room.lastRoundSummary MUST be cleared when a new round starts or after restart
