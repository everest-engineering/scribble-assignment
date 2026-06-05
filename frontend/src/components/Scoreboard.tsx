import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();
  const players = room ? [...room.participants].sort((a, b) => b.score - a.score) : [];

  return (
    <Card title="Scoreboard">
      {players.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="player-list">
          {players.map((player) => (
            <li key={player.id}>
              <span>
                {player.name}
                {room && player.id === room.drawerId ? " ✏️" : ""}
              </span>
              <strong>{player.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
