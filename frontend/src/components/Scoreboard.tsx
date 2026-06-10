import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores?: Record<string, number>;
  drawerParticipantId?: string;
}

export function Scoreboard({ participants, scores = {}, drawerParticipantId }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Waiting for players...</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {participants.map((p) => (
            <li
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <span>
                {p.name}
                {p.id === drawerParticipantId ? (
                  <span style={{ fontSize: "0.75rem", color: "#6366f1", marginLeft: "4px" }}>
                    (drawer)
                  </span>
                ) : null}
              </span>
              <strong>{scores[p.id] ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
