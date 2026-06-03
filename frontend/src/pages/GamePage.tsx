import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { api } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch {
        navigate("/", { replace: true });
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [navigate, room, roomStore]);

  if (!room) {
    return null;
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Game in Progress</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <div className="game-page__main">
          <div className="word-block">
            {participantId === room.currentDrawerId &&
            typeof room.currentWord === "string" &&
            room.currentWord.length > 0 ? (
              <div className="word-block__reveal">
                <span className="word-block__label">Your word:</span>
                <span className="word-block__word">{room.currentWord}</span>
              </div>
            ) : (
              <p className="word-block__waiting">Waiting for the drawer…</p>
            )}
          </div>

          <DrawingCanvas
            strokes={room.strokes ?? []}
            isDrawer={participantId === room.currentDrawerId}
            roomCode={room.code}
            participantId={participantId ?? ""}
          />

          {participantId === room.currentDrawerId && (
            <div className="button-row button-row--compact">
              <button
                className="button button--secondary clear-button"
                type="button"
                onClick={() => {
                  api
                    .updateCanvas(room.code, participantId ?? "", [])
                    .catch(() => {});
                }}
              >
                Clear Canvas
              </button>
            </div>
          )}

          <ul className="participant-list">
            {room.participants.map((participant) => (
              <li key={participant.id} className="participant-list__item">
                <span className="participant-list__name">
                  {participant.name}
                </span>
                <span className="participant-list__role">
                  {participant.id === room.currentDrawerId
                    ? "Drawer"
                    : "Guesser"}
                </span>
              </li>
            ))}
          </ul>

          {participantId !== room.currentDrawerId && (
            <GuessForm
              roomCode={room.code}
              participantId={participantId ?? ""}
            />
          )}
        </div>

        <div className="game-page__sidebar">
          <ResultPanel
            guesses={room.guesses ?? []}
            participants={room.participants}
          />
          <Scoreboard
            participants={room.participants}
            scores={room.scores ?? {}}
          />
        </div>
      </div>

      <div className="button-row">
        <button
          className="button button--secondary"
          onClick={() => navigate("/lobby")}
        >
          Exit Game
        </button>
      </div>
    </section>
  );
}
