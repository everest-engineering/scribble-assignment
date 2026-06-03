import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomPolling } from "../hooks/useRoomPolling";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useRoomPolling(() => {
    void roomStore.fetchRoomPoll();
  }, Boolean(room));

  if (!room || !participantId) {
    return null;
  }

  const isHost = participantId === room.hostParticipantId;
  const playerCount = room.participants.length;
  const canStart = isHost && playerCount >= 2;

  let startDisabledReason: string | null = null;

  if (!isHost) {
    startDisabledReason = "Only the host can start the game";
  } else if (playerCount < 2) {
    startDisabledReason = "Need at least 2 players to start";
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>
                    {participant.name}
                    {participant.id === room.hostParticipantId ? " (host)" : ""}
                  </span>
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}>
            Ready to play
          </p>
          <p style={{ marginTop: "8px" }}>
            {error ?? "Lobby updates automatically every few seconds."}
          </p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button
          className="button button--primary"
          disabled={!canStart}
          onClick={() => navigate("/game")}
        >
          Start Game
        </button>
      </div>
      {startDisabledReason ? (
        <p className="form__error" style={{ marginTop: "12px" }}>
          {startDisabledReason}
        </p>
      ) : null}
    </section>
  );
}
