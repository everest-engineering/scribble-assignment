import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  scores: Record<string, number>;
}

export function Scoreboard({ participants, scores }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
        {participants.length === 0 ? (
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        ) : (
          participants.map((participant) => (
            <div className="placeholder-row" key={participant.id}>
              <span>{participant.name}</span>
              <strong>{scores[participant.id] ?? 0}</strong>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
