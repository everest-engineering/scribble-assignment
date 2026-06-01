import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const title = room?.roundPhase === "ended" ? "Final Scores" : "Scoreboard";

  if (!room) {
    return (
      <Card title={title}>
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for game...</span>
            <strong>0</strong>
          </div>
        </div>
      </Card>
    );
  }

  const scores = room.participants.map((participant) => ({
    participant,
    score: room.scores[participant.id] ?? 0
  }));

  return (
    <Card title={title}>
      {scores.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="player-list">
          {scores.map(({ participant, score }) => (
            <li key={participant.id}>
              <span>{participant.name}</span>
              <strong>{score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
