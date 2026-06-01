import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const totalScore = room?.currentRound?.totalScore ?? 0;
  const guesses = room?.currentRound?.guessHistory ?? [];

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block">
        {room?.participants.map((participant) => {
          const score = guesses
            .filter((guess) => guess.participantId === participant.id)
            .reduce((sum, guess) => sum + guess.score, 0);

          return (
            <div className="placeholder-row" key={participant.id}>
              <span>{participant.name}</span>
              <strong>{score}</strong>
            </div>
          );
        })}
        <div className="placeholder-row">
          <span>Total</span>
          <strong>{totalScore}</strong>
        </div>
      </div>
    </Card>
  );
}
