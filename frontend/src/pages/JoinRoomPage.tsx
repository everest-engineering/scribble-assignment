import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore } from "../state/roomStore";

function validatePlayerName(rawName: string) {
  const trimmed = rawName.trim();

  if (!trimmed) {
    return { error: "Player name is required" as const, value: null };
  }

  if (trimmed.length > 24) {
    return { error: "Player name must be 24 characters or fewer" as const, value: null };
  }

  return { error: null, value: trimmed };
}

function validateRoomCode(rawCode: string) {
  const trimmed = rawCode.trim().toUpperCase();

  if (!trimmed) {
    return { error: "Room code is required" as const, value: null };
  }

  if (trimmed.length !== 4) {
    return { error: "Room code must be 4 characters" as const, value: null };
  }

  return { error: null, value: trimmed };
}

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nameValidation = validatePlayerName(playerName);

    if (nameValidation.error) {
      setError(nameValidation.error);
      return;
    }

    const codeValidation = validateRoomCode(roomCode);

    if (codeValidation.error) {
      setError(codeValidation.error);
      return;
    }

    try {
      setError(null);
      await roomStore.joinRoom(codeValidation.value, nameValidation.value);
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
