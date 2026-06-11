import { Card } from "./Card";

interface Participant {
  id: string;
  name: string;
}

interface ScoreboardProps {
  scores?: Record<string, number>;
  participants?: Participant[];
}

export function Scoreboard({ scores, participants }: ScoreboardProps) {
  const participantMap = new Map(participants?.map((p) => [p.id, p.name]) ?? []);
  const entries = Object.entries(scores ?? {}).sort(([, a], [, b]) => b - a);

  return (
    <Card title="Scoreboard">
      {entries.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="scoreboard-list">
          {entries.map(([participantId, score], index) => (
            <li key={participantId} className={`scoreboard-list__item${index === 0 ? " scoreboard-list__item--leader" : ""}`}>
              <span className="scoreboard-list__rank">{index + 1}</span>
              <span className="scoreboard-list__name">
                {participantMap.get(participantId) ?? "Unknown"}
              </span>
              <strong className="scoreboard-list__score">{score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
