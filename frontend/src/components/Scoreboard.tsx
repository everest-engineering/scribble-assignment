import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room, participantId } = useRoomState();
  const drawerId = room?.round?.drawerId;

  // Highest score first; everyone starts at 0 (FR-006).
  const players = [...(room?.participants ?? [])].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {players.length === 0 ? (
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        ) : (
          players.map((player) => (
            <div className="placeholder-row" key={player.id}>
              <span>
                {player.name}
                {player.id === participantId ? " (you)" : ""}
                {player.id === drawerId ? " ✏️" : ""}
              </span>
              <strong>{player.score}</strong>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
