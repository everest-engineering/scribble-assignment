import type { Participant } from "../services/api";

interface ParticipantListProps {
  participants: Participant[];
  hostId: string;
}

export function ParticipantList({ participants, hostId }: ParticipantListProps) {
  if (participants.length === 0) {
    return <p>No participants are connected to this room yet.</p>;
  }

  return (
    <ul className="player-list">
      {participants.map((participant) => (
        <li key={participant.id}>
          <span>
            {participant.name}
            {participant.id === hostId ? <span className="player-list__badge">Host</span> : null}
          </span>
          <span className="player-list__meta">joined</span>
        </li>
      ))}
    </ul>
  );
}
