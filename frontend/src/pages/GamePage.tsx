import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const {
    room,
    participantId,
    error,
    isHydrating,
    isLoading,
    isDrawer,
    drawerName,
    viewerRoundRole,
    visibleSecretWord
  } = useRoomState();

  useEffect(() => {
    if (!isHydrating && !room) {
      navigate("/", { replace: true });
    }
  }, [isHydrating, navigate, room]);

  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room?.status]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;

  async function handleRefresh() {
    try {
      await roomStore.fetchRoom();
    } catch (_caughtError) {
      // Request errors are already surfaced by the room store state.
    }
  }

  function handleLeave() {
    roomStore.clearSession();
    navigate("/", { replace: true });
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <div className="canvas-placeholder" style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              {drawerName ? `${drawerName} is drawing...` : "Waiting for drawer..."}
            </div>
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Round Info">
            <dl className="detail-list">
              <div>
                <dt>Status</dt>
                <dd>{room.status === "playing" ? "Playing" : "Lobby"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawerName ?? "Waiting for drawer"}</dd>
              </div>
              <div>
                <dt>Your role</dt>
                <dd>{viewerRoundRole ?? "Waiting for round start"}</dd>
              </div>
              <div>
                <dt>Secret word</dt>
                <dd>{isDrawer ? visibleSecretWord ?? "Loading word..." : "Only the drawer can see the word."}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Lobby role</dt>
                <dd>{viewer?.role ?? "Unknown"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm />
          </Card>

          <Card title="Refresh">
            <p>{error ?? "Use refresh to confirm drawer identity and viewer-specific word visibility."}</p>
          </Card>
        </aside>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        <button className="button button--secondary" onClick={handleLeave}>
          Leave Room
        </button>
      </div>
    </section>
  );
}
