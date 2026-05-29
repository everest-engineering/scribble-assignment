import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status !== "playing") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void roomStore
        .fetchRoom()
        .then(() => {
          setRefreshError(null);
        })
        .catch((caughtError) => {
          setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
        });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room?.code, room?.status, roomStore]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer =
    room.participants.find((participant) => participant.id === room.drawerParticipantId) ?? null;
  const drawerStatus = room.viewerIsDrawer ? "You are the drawer for this round." : `${drawer?.name ?? "Another player"} is drawing this round.`;
  const wordStatus = room.wordVisibility === "visible" ? "Secret word visible" : "Secret word hidden";
  const wordValue = room.wordVisibility === "visible" ? room.secretWord ?? "Unavailable" : "Only the drawer can see the word right now.";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Round Started</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar">
          <Card title="Round Status">
            <p className={`status-line ${room.viewerIsDrawer ? "status-line--success" : "status-line--info"}`}>
              {room.viewerIsDrawer ? "Drawer assigned to you" : "Viewer joined as guesser"}
            </p>
            <p>{drawerStatus}</p>
            {refreshError ? <p className="form__error">{refreshError}</p> : null}
          </Card>

          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{room.viewerIsDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Host</dt>
                <dd>{room.viewerIsHost ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="Secret Word">
            <p className={`status-line ${room.wordVisibility === "visible" ? "status-line--success" : "status-line--muted"}`}>
              {wordStatus}
            </p>
            <div className={`word-panel ${room.wordVisibility === "visible" ? "word-panel--visible" : "word-panel--hidden"}`}>
              <span className="word-panel__label">
                {room.wordVisibility === "visible" ? "Your word" : "Word visibility"}
              </span>
              <strong className="word-panel__value">{wordValue}</strong>
            </div>
          </Card>

          <Card title="Canvas">
            <div className="canvas-placeholder">
              Drawing interactions start in the next scenario.
            </div>
          </Card>
        </div>

        <aside className="game-page__sidebar">
          <Card title="Participants">
            <ul className="player-list">
              {room.participants.map((participant) => {
                const labels = [];

                if (participant.id === participantId) {
                  labels.push("you");
                }

                if (participant.id === room.hostParticipantId) {
                  labels.push("host");
                }

                if (participant.id === room.drawerParticipantId) {
                  labels.push("drawer");
                }

                return (
                  <li key={participant.id}>
                    <span>{participant.name}</span>
                    <span className="player-list__meta">{labels.join(" · ") || "joined"}</span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="button-row button-row--compact">
            <button className="button button--secondary" onClick={handleRefresh}>
              Refresh State
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
