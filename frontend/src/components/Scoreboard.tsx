import { Card } from "./Card";
import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
  currentPlayerId?: string;
}

export function Scoreboard({ participants, currentPlayerId }: ScoreboardProps) {
  // Sort participants by score descending
  const sortedParticipants = [...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <Card title="Scoreboard">
      <ul className="player-list">
        {sortedParticipants.map((p) => {
          const isMe = p.id === currentPlayerId;
          const roleLabel = p.role ? (p.role === "drawer" ? "Drawer" : "Guesser") : null;

          return (
            <li
              key={p.id}
              className={isMe ? "player-item--me" : ""}
              style={
                isMe
                  ? {
                      borderColor: "var(--brand)",
                      background: "#eff6ff",
                    }
                  : undefined
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>
                  {p.name} {isMe && "(You)"}
                </span>
                {roleLabel && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: p.role === "drawer" ? "#fee2e2" : "#f3f4f6",
                      color: p.role === "drawer" ? "#991b1b" : "#4b5563",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.025em"
                    }}
                  >
                    {roleLabel}
                  </span>
                )}
              </div>
              <strong style={{ color: "var(--brand-strong)", fontSize: "1.125rem" }}>
                {p.score ?? 0} pts
              </strong>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
