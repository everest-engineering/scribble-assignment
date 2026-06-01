import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room || room.participants.length === 0) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {room.participants.map((participant) => {
          const isDrawer = room.drawerId === participant.id;
          return (
            <div key={participant.id} className="placeholder-row">
              <span>
                {participant.name}
                {isDrawer ? (
                  <span className="player-list__badge" style={{ marginLeft: "8px" }}>
                    {" "}
                    Drawing
                  </span>
                ) : null}
              </span>
              <strong>{room.scores[participant.id] ?? 0}</strong>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
