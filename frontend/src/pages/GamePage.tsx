import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { GAME_POLL_MS } from "../constants/game";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      void roomStore.hydrateFromSession().then((restored) => {
        if (!restored) {
          navigate("/", { replace: true });
        }
      });
    }
  }, [navigate, room, roomStore]);

  useEffect(() => {
    if (!room || room.status !== "drawing" || !participantId) {
      return;
    }

    void roomStore.fetchRoom();
    const intervalId = window.setInterval(() => {
      void roomStore.fetchRoom();
    }, GAME_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [participantId, room?.code, room?.status, roomStore]);

  if (!room || room.status !== "drawing" || !participantId) {
    return null;
  }

  const viewer = room.viewer;
  const isDrawer = viewer?.role === "drawer";
  const self = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find(
    (participant) => participant.id === room.drawerParticipantId
  );
  const canvasStrokes = room.canvasStrokes ?? [];

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.roundNumber ?? 1}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <GuessHistory />
          <ResultPanel />

          <Card title="Players">
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {participant.id === room.drawerParticipantId ? "drawing" : "guessing"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              strokes={canvasStrokes}
              readOnly={!isDrawer}
              roomCode={room.code}
              participantId={participantId}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Your Role">
            <p className="role-banner">
              {isDrawer ? "You are drawing" : "You are guessing"}
            </p>
          </Card>

          {isDrawer ? (
            <Card title="Secret Word">
              <p className="secret-word">{viewer?.secretWord ?? "—"}</p>
              <p className="secret-word-hint">Only you can see this word.</p>
            </Card>
          ) : (
            <Card title="Your Turn">
              <p className="guesser-prompt">
                Watch the drawing and submit your guess when ready.
              </p>
            </Card>
          )}

          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{self?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm disabled={isDrawer} />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
