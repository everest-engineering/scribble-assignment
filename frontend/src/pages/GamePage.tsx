import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { DrawerWordSelect } from "./DrawerWordSelect";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const strokesQueueRef = useRef<ReturnType<typeof roomStore.addStroke> | null>(null);
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const phase = room?.phase;
  const pollInterval = phase === "drawing" ? 500 : 2000;

  useEffect(() => {
    if (!room) return;
    const pollId = setInterval(() => {
      roomStore.fetchRoom().catch(() => {});
    }, pollInterval);
    return () => clearInterval(pollId);
  }, [room, roomStore, pollInterval]);

  if (!room) {
    return null;
  }

  const isDrawer = participantId === room.drawerId;

  async function handleGuess(text: string) {
    try {
      setGuessFeedback(null);
      const result = await roomStore.submitGuess(text);
      if (result.correct) {
        setGuessFeedback("Correct! Well done!");
      } else {
        setGuessFeedback("Incorrect. Try again!");
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to submit guess";
      setGuessFeedback(message);
    }
  }

  async function handleStroke(stroke: { points: { x: number; y: number }[]; color: string; width: number }) {
    try {
      strokesQueueRef.current = roomStore.addStroke([stroke]);
      await strokesQueueRef.current;
    } catch {
      // Silently handle stroke submission errors
    }
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Game In Progress</span>
          <h1 className="game-page__title">
            {isDrawer ? "You are the Drawer" : "You are a Guesser"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Card title="Players">
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>
                    {participant.name}
                    {participant.id === room.drawerId && (
                      <span className="host-badge"> (Drawing)</span>
                    )}
                    {participant.id === participantId && (
                      <span> (You)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <div className="game-page__main">
          {phase === "word-selection" && isDrawer ? (
            <DrawerWordSelect />
          ) : phase === "word-selection" && !isDrawer ? (
            <Card title="Canvas">
              <div className="canvas-placeholder">
                <p>The drawer is selecting a word...</p>
              </div>
            </Card>
          ) : phase === "drawing" && isDrawer ? (
            <Card title="Your Canvas">
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                  Draw this word: <strong style={{ fontSize: "18px", color: "#1f2937" }}>{room.secretWord}</strong>
                </p>
              </div>
              <DrawingCanvas strokes={room.strokes} onStroke={handleStroke} />
            </Card>
          ) : phase === "drawing" && !isDrawer ? (
            <Card title="Canvas">
              <DrawingCanvas strokes={room.strokes} />
            </Card>
          ) : (
            <Card title="Canvas">
              <div className="canvas-placeholder">
                <p>The drawer is drawing...</p>
              </div>
            </Card>
          )}

          {phase === "drawing" && (
            <>
              {!isDrawer && (
                <Card title="Make a Guess">
                  <GuessForm
                    onSubmit={handleGuess}
                    feedback={guessFeedback}
                  />
                </Card>
              )}
              <Card title="Guesses">
                {room.guesses.length === 0 ? (
                  <p style={{ color: "#6b7280", fontSize: "14px" }}>No guesses yet.</p>
                ) : (
                  <ul className="player-list">
                    {room.guesses.map((guess, index) => (
                      <li key={index}>
                        <span>
                          <strong>{guess.participantName}</strong>: {guess.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{room.participants.find((p) => p.id === participantId)?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
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
