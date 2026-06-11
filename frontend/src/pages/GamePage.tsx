import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { GuessingCanvas } from "../components/GuessingCanvas";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    roomStore.startPolling();
    return () => {
      roomStore.stopPolling();
    };
  }, [roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((p) => p.id === participantId) ?? null;
  const drawer = room.participants.find((p) => p.id === room.drawerId) ?? null;
  const isDrawer = room.yourRole === "drawer";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {room.roundNumber ?? "?"}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <div className="game-page__main">
          {isDrawer ? (
            <div className="card">
              <div className="card__body">
                <div className="game-role-display">
                  <p className="game-role-label">You are the drawer!</p>
                  <p className="game-word-display">{room.wordForDrawer}</p>
                </div>
              </div>
              <div className="card__body">
                <DrawingCanvas
                  onStroke={(points) => roomStore.addStroke(points)}
                  onClear={() => roomStore.clearCanvas()}
                />
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card__body">
                <div className="game-role-display">
                  <p className="game-role-label">
                    {drawer ? `${drawer.name} is drawing` : "Waiting for drawer..."}
                  </p>
                  <p className="game-word-length">
                    Word length: <strong>{room.wordLength ?? "?"}</strong>
                  </p>
                </div>
              </div>
              <div className="card__body">
                <GuessingCanvas strokes={room.strokes} />
              </div>
            </div>
          )}
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          {!isDrawer && (
            <div className="card">
              <div className="card__header">
                <h2>Your Guess</h2>
              </div>
              <div className="card__body">
                <GuessForm
                  onSubmit={(text) => roomStore.submitGuess(text)}
                />
              </div>
            </div>
          )}
          <div className="card">
            <div className="card__header">
              <h2>Players</h2>
            </div>
            <div className="card__body">
              <ul className="player-list">
                {room.participants.map((participant) => (
                  <li key={participant.id}>
                    <span>
                      {participant.name}
                      {room.hostId === participantId && room.hostId === participant.id ? (
                        <span className="host-badge host-badge--self"> (You — host)</span>
                      ) : room.hostId === participant.id ? (
                        <span className="host-badge"> (host)</span>
                      ) : participant.id === room.drawerId ? (
                        <span className="drawer-badge"> (drawing)</span>
                      ) : null}
                    </span>
                    <span className="player-list__meta">{participant.id === room.drawerId ? "Drawing" : "Guessing"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <GuessHistory
            guesses={room.guesses}
            participants={room.participants}
            scores={room.scores}
          />
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
