import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
          <Scoreboard />
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

          <Card title="Canvas">
            <div
              className="canvas-placeholder"
              style={{ minHeight: "500px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
            >
              {isDrawer ? "Drawing canvas (Scenario 3)" : "Watching the drawer (Scenario 3)"}
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
