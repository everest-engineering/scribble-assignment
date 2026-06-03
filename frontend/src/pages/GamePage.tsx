import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CanvasBoard } from "../components/CanvasBoard";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useLobbyPolling } from "../state/useLobbyPolling";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useLobbyPolling(room?.code ?? null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const round = room.currentRound;
  const drawer = round
    ? room.participants.find((participant) => participant.id === round.drawerParticipantId) ?? null
    : null;
  const isDrawer = !!round && participantId === round.drawerParticipantId;
  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;

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
          <Scoreboard
            participants={room.participants}
            drawerParticipantId={round?.drawerParticipantId}
          />
          <Card title="Guess history">
            {room.guesses.length === 0 ? (
              <p>No guesses yet.</p>
            ) : (
              <ul className="player-list" data-testid="guess-history">
                {[...room.guesses]
                  .sort((a, b) => a.order - b.order)
                  .map((entry) => {
                    const guesser =
                      room.participants.find((p) => p.id === entry.guesserParticipantId) ?? null;
                    const displayedText = entry.text === null ? "<correct guess>" : entry.text;
                    return (
                      <li key={entry.id}>
                        <span>
                          <strong>{guesser?.name ?? "Unknown"}</strong>: {displayedText}
                        </span>
                        <span className="player-list__meta">
                          {entry.isCorrect ? "correct" : "incorrect"}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </Card>
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          {isDrawer ? (
            <Card title="You're the drawer" badge="Your word">
              <p className="secret-word" data-testid="secret-word">
                {round!.secretWord}
              </p>
              <p>Draw it so the others can guess!</p>
            </Card>
          ) : (
            <Card title={drawer ? `${drawer.name} is drawing` : "Waiting for the drawer"}>
              <p className="secret-word-placeholder">Waiting for the drawer to begin…</p>
            </Card>
          )}

          {isDrawer ? (
            <Card title="Canvas">
              <CanvasBoard />
            </Card>
          ) : null}
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
            </dl>
          </Card>

          {isDrawer ? null : (
            <Card title="Your Guess">
              <GuessForm
                onSubmit={async (text) => {
                  await roomStore.submitGuess(text);
                }}
              />
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
