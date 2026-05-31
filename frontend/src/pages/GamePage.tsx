import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { api, type GuessEntry } from "../services/api";
import { useRoomState } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.fetchGuesses(room.code);
        setGuesses(data.guesses);
        setScores(data.scores);
      } catch {
        // polling failure is non-fatal
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [room?.code]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = participantId === room.currentDrawerId;
  const drawer = room.participants.find((p) => p.id === room.currentDrawerId) ?? null;

  async function handleGuessSubmit(guessText: string): Promise<void> {
    if (!participantId) return;
    // room is non-null here — guarded by early return above
    await api.submitGuess(room!.code, participantId, guessText);
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{isDrawer ? "You are drawing!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={scores} />
          <ResultPanel guesses={guesses} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer ? (
              <DrawingCanvas />
            ) : (
              <p className="canvas-placeholder">Drawer is drawing…</p>
            )}
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
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Drawing</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              {isDrawer && room.secretWord ? (
                <div>
                  <dt>Secret Word</dt>
                  <dd><strong>{room.secretWord}</strong></dd>
                </div>
              ) : !isDrawer ? (
                <div>
                  <dt>Secret Word</dt>
                  <dd>???</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuessSubmit} />
            </Card>
          )}
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
