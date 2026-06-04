import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessBox } from "../components/GuessBox";
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
    if (!room) return;

    const intervalId = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch (err) {
        // Silently catch polling issues
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((p) => p.id === room.drawerId) ?? null;
  const isDrawer = room.drawerId === participantId;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">
            {isDrawer ? "You are drawing!" : `${drawer?.name ?? "Someone"} is drawing!`}
          </span>
          <h1 className="game-page__title">
            {isDrawer ? `Word to draw: ${room.wordTemplate}` : `Word: ${room.wordTemplate ? room.wordTemplate.split("").join(" ") : ""}`}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd style={{ textTransform: "capitalize" }}>{viewer?.role ?? "Guesser"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              isDrawer={isDrawer}
              drawingData={room.drawingData}
              onChange={(data) => roomStore.updateCanvas(data)}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <GuessBox isDrawer={isDrawer} />
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
