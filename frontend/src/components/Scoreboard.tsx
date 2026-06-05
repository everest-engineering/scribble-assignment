import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  const rows = participants
    .map((participant) => ({
      id: participant.id,
      name: participant.name,
      score: scores[participant.id] ?? 0
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {rows.length === 0 ? (
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        ) : (
          rows.map((row) => (
            <div className="placeholder-row" key={row.id}>
              <span>{row.name}</span>
              <strong>{row.score}</strong>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
