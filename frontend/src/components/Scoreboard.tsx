import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room) {
    return (
      <Card title="Scoreboard">
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>No active room</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      <div className="scoreboard-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {room.participants.map((participant) => {
          const isDrawer = room.drawerId === participant.id;
          return (
            <div
              key={participant.id}
              className="scoreboard-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: isDrawer ? "#fef3c7" : "#f9fafb",
                border: "1px solid",
                borderColor: isDrawer ? "#f59e0b" : "#e5e7eb",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: isDrawer ? "600" : "400" }}>{participant.name}</span>
                {isDrawer && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      backgroundColor: "#f59e0b",
                      color: "#ffffff",
                      padding: "2px 6px",
                      borderRadius: "9999px"
                    }}
                  >
                    Drawer
                  </span>
                )}
              </div>
              <strong style={{ color: isDrawer ? "#b45309" : "#111827" }}>{participant.score} pts</strong>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

