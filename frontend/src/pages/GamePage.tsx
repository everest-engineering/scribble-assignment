import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
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

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status === "lobby") {
      return undefined;
    }

    async function refresh() {
      try {
        await roomStore.fetchRoom();
      } catch {
        // errors are handled by store state
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 2000);
    return () => {
      window.clearInterval(interval);
    };
  }, [room?.code, room?.status, roomStore]);

  if (!room) {
    return null;
  }

  const viewer =
    room.participants.find((participant) => participant.id === participantId) ??
    null;
  const isDrawer = room.drawerId === viewer?.id;
  const drawer =
    room.participants.find((participant) => participant.id === room.drawerId) ??
    null;
  const isHost = viewer?.isHost === true;
  const isResult = room.status === "results";
  const roundWinner = room.guesses.find((guess) => guess.correct) ?? null;
  const title = isResult ? "Round Complete" : "Guess the Word!";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{title}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title={isDrawer ? "Canvas" : "Drawing"}>
            <DrawingCanvas readOnly={!isDrawer || room.status !== "active"} />
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
                <dt>Current drawer</dt>
                <dd>{drawer?.name ?? "Unknown"}</dd>
              </div>
              {room.secretWord ? (
                <>
                  <div>
                    <dt>Secret word</dt>
                    <dd>{room.secretWord}</dd>
                  </div>
                  <div>
                    <dt>Tip</dt>
                    <dd>
                      {isResult
                        ? "Round complete. Review the results below."
                        : "Only you can see this word."}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          </Card>

          {room.status === "active" && !isDrawer ? (
            <Card title="Your Guess">
              <GuessForm />
            </Card>
          ) : null}

          {isResult ? (
            <Card title="Round Result">
              <p>
                {roundWinner
                  ? `${roundWinner.participantName} guessed the word correctly!`
                  : "The round has ended."}
              </p>
              {isHost ? (
                <button
                  className="button button--primary"
                  onClick={async () => {
                    try {
                      await roomStore.restartGame();
                    } catch {
                      // error state is handled by the store
                    }
                  }}
                >
                  Restart Round
                </button>
              ) : (
                <p style={{ color: "#4b5563" }}>
                  Waiting for the host to restart the game.
                </p>
              )}
            </Card>
          ) : null}
        </aside>
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
