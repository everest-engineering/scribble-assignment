import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  drawerParticipantId?: string;
}

export function Scoreboard({ participants, drawerParticipantId }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul className="player-list">
          {participants.map((participant) => {
            const isDrawer = participant.id === drawerParticipantId;
            return (
              <li key={participant.id}>
                <span>
                  {participant.name}
                  {isDrawer ? (
                    <span className="player-list__meta" style={{ marginLeft: "8px" }}>
                      Drawer
                    </span>
                  ) : null}
                </span>
                <strong>{participant.score}</strong>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
