import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState } from "../state/roomStore";
import { DrawerWordSelect } from "./DrawerWordSelect";

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

  const isDrawer = participantId === room.drawerId;
  const phase = room.phase;

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
              <div className="canvas-placeholder" style={{ minHeight: '400px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>The drawer is selecting a word...</p>
              </div>
            </Card>
          ) : phase === "drawing" && isDrawer ? (
            <Card title="Your Secret Word">
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Draw this word:</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{room.secretWord}</p>
              </div>
            </Card>
          ) : (
            <Card title="Canvas">
              <div className="canvas-placeholder" style={{ minHeight: '400px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>The drawer is drawing...</p>
              </div>
            </Card>
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
