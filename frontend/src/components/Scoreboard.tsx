import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  const sorted = [...(room?.scores ?? [])].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {sorted.length === 0 ? (
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        ) : (
          sorted.map(({ participantId, score }) => {
            const name = room?.participants.find((p) => p.id === participantId)?.name ?? "Unknown";
            return (
              <div key={participantId} className="placeholder-row">
                <span>{name}</span>
                <strong>{score}</strong>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
