import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useGamePolling } from "../hooks/useGamePolling";
import { useRoomState } from "../state/roomStore";

function roleMetaClass(role?: "drawer" | "guesser") {
  if (role === "drawer") {
    return "player-list__meta player-list__meta--drawer";
  }

  if (role === "guesser") {
    return "player-list__meta player-list__meta--guesser";
  }

  return "player-list__meta";
}

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();
  const pollError = useGamePolling();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.viewerRole === "drawer";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {pollError ? <p className="form__error">{pollError}</p> : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />

          <Card title="Participants">
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  <span className={roleMetaClass(participant.role)}>
                    {participant.role ?? "player"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <div className="game-page__main">
          {isDrawer ? (
            <Card title="Secret Word">
              <p className="secret-word">{room.secretWord}</p>
            </Card>
          ) : null}

          <Card title="Canvas">
            <div className="canvas-placeholder" style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
              {isDrawer ? "Draw the secret word..." : "Waiting for drawer..."}
            </div>
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{room.viewerRole ?? "unknown"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessForm />
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
