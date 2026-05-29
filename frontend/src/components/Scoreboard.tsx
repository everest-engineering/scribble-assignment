import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const scoresByParticipant = new Map(room?.scores.map((score) => [score.participantId, score]) ?? []);
  const scores =
    room?.participants.map((participant) => ({
      participantId: participant.id,
      participantName: participant.name,
      score: scoresByParticipant.get(participant.id)?.score ?? 0
    })) ?? [];

  return (
    <Card title="Scoreboard">
      {scores.length === 0 ? (
        <p>No scores yet.</p>
      ) : (
        <ul className="score-list">
          {scores.map((score) => (
            <li key={score.participantId}>
              <span>{score.participantName}</span>
              <strong>{score.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
