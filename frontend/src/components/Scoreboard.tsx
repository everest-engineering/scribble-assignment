import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room) {
    return null;
  }

  return (
    <div>
      <h3 style={{ marginBottom: "12px" }}>Scores</h3>

      <ul className="player-list">
        {room.participants.map((participant) => (
          <li key={participant.id}>
            <span>{participant.name}</span>
            <span>{participant.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}