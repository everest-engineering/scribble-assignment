import { Card } from "./Card";
import type { Participant, ParticipantScore } from "../services/api";

interface ScoreboardProps {
  scores: ParticipantScore[];
  participants: Participant[];
}

export function Scoreboard({ scores = [], participants = [] }: ScoreboardProps) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  const nameMap = new Map(participants.map((p) => [p.id, p.name]));

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="score-list">
          {sorted.map((entry) => (
            <li key={entry.participantId} className="score-entry">
              <span className="score-entry__name">
                {nameMap.get(entry.participantId) ?? "Unknown"}
              </span>
              <strong className="score-entry__value">{entry.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
