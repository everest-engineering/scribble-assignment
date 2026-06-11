import { Card } from "./Card";
import type { FinalStanding } from "../services/api";

interface Participant {
  id: string;
  name: string;
}

interface FinalStandingsProps {
  finalStandings: FinalStanding[];
  participants: Participant[];
}

export function FinalStandings({ finalStandings }: FinalStandingsProps) {
  const winner = finalStandings.find((s) => s.rank === 1);

  return (
    <Card title="Final Standings">
      {winner && (
        <div className="winner-banner" style={{
          backgroundColor: "#fef3c7",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
          textAlign: "center"
        }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#92400e" }}>
            Winner: {winner.name} — {winner.score} points
          </span>
        </div>
      )}

      <ol className="standings-list">
        {finalStandings.map((standing) => (
          <li
            key={standing.participantId}
            className={`standings-list__item${standing.rank === 1 ? " standings-list__item--winner" : ""}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: standing.rank === 1 ? "#fef3c7" : "transparent",
              borderRadius: "6px",
              marginBottom: "4px"
            }}
          >
            <span>
              <strong>#{standing.rank}</strong> {standing.name}
            </span>
            <span style={{ fontWeight: 600 }}>{standing.score} pts</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
