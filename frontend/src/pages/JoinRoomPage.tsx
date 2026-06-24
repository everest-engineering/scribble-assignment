import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore } from "../state/roomStore";

const ROOM_CODE_PATTERN = /^[A-Z0-9]{4}$/;

function validateRoomCode(code: string): string | null {
  const trimmed = code.trim();

  if (!trimmed) {
    return "Room code is required";
  }

  const normalized = trimmed.toUpperCase();

  if (!ROOM_CODE_PATTERN.test(normalized)) {
    return "Room code must be exactly 4 characters";
  }

  return null;
}

function validatePlayerName(name: string): string | null {
  if (!name.trim()) {
    return "Player name is required";
  }

  return null;
}

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const codeError = validateRoomCode(roomCode);

    if (codeError) {
      setError(codeError);
      return;
    }

    const nameError = validatePlayerName(playerName);

    if (nameError) {
      setError(nameError);
      return;
    }

    try {
      setError(null);
      await roomStore.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      navigate("/lobby");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to join room");
    }
  }

  return (
    <section className="panel panel--narrow placeholder-page">
      <PageHeader
        kicker="Existing lobby"
        title="Join Room"
        description="Enter your player name and the room code to join an existing lobby."
      />
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Player name</span>
          <input
            className="form__input"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Second pencil"
          />
        </label>

        <label className="form__field">
          <span>Room code</span>
          <input
            className="form__input form__input--code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="ABCD"
            maxLength={4}
          />
        </label>
        {error ? <p className="form__error">{error}</p> : null}
        <div className="button-row">
          <button className="button button--primary" type="submit">
            Join Lobby
          </button>
          <button className="button button--secondary" type="button" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
