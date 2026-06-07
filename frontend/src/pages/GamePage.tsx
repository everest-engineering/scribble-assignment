import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const round = room.round;

  // Who is the drawer, and is the current viewer that drawer? Every player can
  // see who the drawer is (FR-003); only the drawer learns the word (FR-006/7).
  const drawer = round
    ? room.participants.find((participant) => participant.id === round.drawerId) ?? null
    : null;
  const isDrawer = round != null && participantId === round.drawerId;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {round?.number ?? 1}</span>
          <h1 className="game-page__title">{isDrawer ? "Your turn to draw!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title={isDrawer ? "Your word to draw" : "The word"}>
            <div className="word-reveal" style={{ textAlign: "center", padding: "16px" }}>
              {isDrawer ? (
                <strong className="word-reveal__word" style={{ fontSize: "1.75rem", letterSpacing: "0.1em" }}>
                  {round?.word}
                </strong>
              ) : (
                <span
                  className="word-reveal__blanks"
                  style={{ fontSize: "1.75rem", letterSpacing: "0.35em", fontFamily: "monospace" }}
                >
                  {round?.maskedWord ?? ""}
                </span>
              )}
              <p className="word-reveal__hint" style={{ marginTop: "8px", color: "#6b7280" }}>
                {isDrawer
                  ? "Only you can see this word. Draw it for the others!"
                  : `${round?.wordLength ?? 0} letters — ${drawer?.name ?? "the drawer"} is drawing.`}
              </p>
            </div>
          </Card>

          <Card title="Canvas">
            <div className="canvas-placeholder" style={{ minHeight: '440px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              {isDrawer ? "Your canvas — start drawing!" : `Waiting for ${drawer?.name ?? "the drawer"}...`}
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
                <dt>Your role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "—"}</dd>
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
