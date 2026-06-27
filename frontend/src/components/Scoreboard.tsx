import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function Scoreboard() {
  const { room } = useRoomState();

  if (!room || room.participants.length === 0) {
    return (
      <Card title="Scoreboard">
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Waiting for players...</p>
      </Card>
    );
  }

  return (
    <Card title="Scoreboard">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: "4px 8px" }}>Player</th>
            <th style={{ textAlign: "right", padding: "4px 8px" }}>Round</th>
            <th style={{ textAlign: "right", padding: "4px 8px" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {room.participants.map((p) => {
            const score = room.scores[p.id];
            return (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "4px 8px" }}>
                  {p.name}
                  {p.id === room.drawerId ? " (drawing)" : ""}
                </td>
                <td style={{ textAlign: "right", padding: "4px 8px" }}>{score?.roundScore ?? 0}</td>
                <td style={{ textAlign: "right", padding: "4px 8px" }}>{score?.cumulativeScore ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
