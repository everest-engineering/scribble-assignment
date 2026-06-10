import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore } from "../state/roomStore";

export const PLAYER_NAME_MAX = 24;

export function isCreateFormValid(playerName: string): boolean {
  const trimmed = playerName.trim();
  return trimmed.length > 0 && trimmed.length <= PLAYER_NAME_MAX;
}

export function CreateRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  const canSubmit = isCreateFormValid(playerName);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setError(null);
      await roomStore.createRoom(playerName.trim());
      navigate("/lobby");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create room");
    }
  }

  return (
    <section className="panel panel--narrow placeholder-page">
      <PageHeader
        kicker="New lobby"
        title="Create Room"
        description="Pick a player name, create a room, and continue into the lobby."
      />
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Player name</span>
          <input
            className="form__input"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Sketch captain"
            maxLength={PLAYER_NAME_MAX}
          />
        </label>
        {error ? <p className="form__error">{error}</p> : null}
        <div className="button-row">
          <button className="button button--primary" type="submit" disabled={!canSubmit}>
            Create and Continue
          </button>
          <button className="button button--secondary" type="button" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
