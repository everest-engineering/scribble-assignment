import { Card } from "./Card";
import type { RoomSnapshot } from "../services/api";

interface ScoreboardProps {
  room: RoomSnapshot;
  participantId: string | null;
}

export function Scoreboard({ room, participantId }: ScoreboardProps) {
  const drawer = room.participants.find((participant) => participant.id === room.currentDrawerId);

  return (
    <Card title="Scoreboard" badge={drawer ? `Drawer: ${drawer.name}` : "Waiting"}>
      <ul className="player-list player-list--game">
        {room.participants.map((participant) => {
          const role = participant.role ?? (participant.id === room.currentDrawerId ? "drawer" : "guesser");
          const isViewer = participant.id === participantId;
          const isDrawer = role === "drawer";

          return (
            <li
              key={participant.id}
              className={`player-list__item${isViewer ? " player-list__item--viewer" : ""}${isDrawer ? " player-list__item--drawer" : ""}`}
            >
              <span className="player-list__name">
                {participant.name}
                {isViewer ? <span className="player-list__self">you</span> : null}
              </span>
              <span className="player-list__meta-group">
                <span className={`player-list__meta player-list__meta--${role}`}>{role}</span>
                <span className="player-list__score">{participant.score} pts</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
