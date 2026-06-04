import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p>Waiting for players...</p>
        </div>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          {participants.map((p) => (
            <div key={p.id} className="placeholder-row">
              <span>{p.name}{p.isDrawer ? " (drawing)" : ""}</span>
              <strong>{p.score}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
