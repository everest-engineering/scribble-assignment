import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, error, isLoading, pollError } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const currentParticipant = room?.participants.find(
    (p) => p.id === roomStore.getParticipantId()
  );
  const isHost = currentParticipant?.isHost ?? false;
  const hasEnoughPlayers = (room?.participants.length ?? 0) >= 2;
  const isAwaitingRename = room?.status === "awaiting_rename";
  const needsRename = isAwaitingRename && room?.invalidParticipantIds?.includes(roomStore.getParticipantId() ?? "");
  const canStart = isHost && hasEnoughPlayers && !isLoading && !isAwaitingRename;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }
    roomStore.startPolling();
    return () => {
      roomStore.stopPolling();
    };
  }, [navigate, room, roomStore]);

  useEffect(() => {
    if (room?.status === "playing") {
      navigate("/game");
    }
  }, [room?.status, navigate]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleStartGame() {
    try {
      setStartError(null);
      const response = await roomStore.startGame();
      if (response.status === "playing") {
        navigate("/game");
      }
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start game");
    }
  }

  async function handleRename() {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    try {
      setStartError(null);
      const response = await roomStore.renamePlayer(trimmed);
      setRenameValue("");
      if (response.status === "playing") {
        navigate("/game");
      }
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to rename");
    }
  }

  async function handleDisband() {
    try {
      await roomStore.disbandRoom();
      navigate("/", { replace: true });
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to disband");
    }
  }

  if (!room) {
    return null;
  }

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker={isAwaitingRename ? "Name required" : "Waiting for players"}
          title="Lobby"
          description={isAwaitingRename
            ? "Some players need to update their names before the game can start."
            : "Share the room code with friends so they can join your game."}
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
                  <span>{participant.name}</span>
                  <span className="player-list__meta">{participant.isHost ? "host" : "joined"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : isAwaitingRename ? "Awaiting valid names" : "Ready to play"}
          </p>

          {isAwaitingRename && needsRename ? (
            <div style={{ marginTop: '8px' }}>
              <p>Your name is invalid. Please enter a valid name to proceed:</p>
              <div className="rename-input-row" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isLoading}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
                  style={{ flex: 1, padding: '8px', fontSize: '14px' }}
                />
                <button
                  className="button button--primary"
                  disabled={isLoading || !renameValue.trim()}
                  onClick={handleRename}
                >
                  {isLoading ? "Updating..." : "Set Name"}
                </button>
              </div>
            </div>
          ) : (
            <p style={{ marginTop: '8px' }}>
              {error ?? refreshError ?? startError ?? pollError ?? (
                isAwaitingRename && isHost
                  ? "Waiting for other players to fix their names..."
                  : isAwaitingRename
                    ? "Waiting for players to fix their names..."
                    : isHost && !hasEnoughPlayers
                      ? "Waiting for at least one more player to join."
                      : isHost
                        ? "You can start the game when ready."
                        : "Waiting for the host to start the game."
              )}
            </p>
          )}
        </Card>
      </div>

      <div className="button-row button-row--spread">
        {isAwaitingRename && isHost ? (
          <button className="button button--secondary" disabled={isLoading} onClick={handleDisband}>
            {isLoading ? "Disbanding..." : "Disband Room"}
          </button>
        ) : (
          <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
            {isLoading ? "Refreshing..." : "Refresh Room"}
          </button>
        )}
        {!isAwaitingRename && isHost ? (
          <button className="button button--primary" disabled={!canStart} onClick={handleStartGame}>
            {!hasEnoughPlayers ? "Need more players" : "Start Game"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
