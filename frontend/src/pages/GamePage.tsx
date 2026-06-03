import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomPolling, useRoomState } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const { room } = useRoomState();

  useRoomPolling(POLL_INTERVAL_MS);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // A restart returns everyone to the lobby (feature group 4).
  useEffect(() => {
    if (room && room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const isDrawer = room.viewer?.isDrawer ?? false;
  const drawer = room.participants.find((participant) => participant.isDrawer) ?? null;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">{isDrawer ? "You are drawing" : "You are guessing"}</span>
          <h1 className="game-page__title">
            {isDrawer ? "Draw the secret word!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Card title="Round">
            <dl className="detail-list">
              <div>
                <dt>Drawer</dt>
                <dd>{drawer ? drawer.name : "—"}</dd>
              </div>
              <div>
                <dt>Your role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer ? (
              <p className="word-banner">
                Your word to draw: <strong>{room.word ?? "…"}</strong>
              </p>
            ) : (
              <p className="word-banner">Watch the drawing and guess the word.</p>
            )}
            <div
              className="canvas-placeholder"
              style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
            >
              Drawing tools arrive in the next step…
            </div>
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Players">
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className="player-list__meta">
                    {participant.isDrawer ? "drawer" : "guesser"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Back to Lobby
        </button>
      </div>
    </section>
  );
}
