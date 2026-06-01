import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useRoomStore } from "../state/roomStore";
import { isValidRoomCode, roomCodeErrorMessage } from "../utils/validation";

export function JoinRoomPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState("");
  const navigate = useNavigate();
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Basic client-side validation for code format
    const code = roomCode.trim().toUpperCase();
    if (!isValidRoomCode(code)) {
      setError(
        codeError ||
          "Please enter a 4-character room code (letters and numbers)"
      );
      return;
    }

    try {
      setError(null);
      const name = playerName.trim();
      if (!name) {
        setError("Please enter a name.");
        return;
      }
      await roomStore.joinRoom(code, name);
      navigate("/lobby");
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        const status = (caughtError as any).status as number | undefined;

        if (status === 404) {
          setError("Room not found — check the code and try again.");
          return;
        }

        if (status === 409) {
          setError("Unable to join — the game may have already started.");
          return;
        }

        setError(caughtError.message || "Unable to join room");
        return;
      }

      setError("Unable to join room");
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
            onChange={(event) => {
              const val = event.target.value.toUpperCase();
              setRoomCode(val);
              setCodeError(roomCodeErrorMessage(val));
            }}
            placeholder="ABCD"
          />
        </label>
        {codeError ? (
          <p className="form__error">{codeError}</p>
        ) : error ? (
          <p className="form__error">{error}</p>
        ) : null}
        <div className="button-row">
          <button
            className="button button--primary"
            type="submit"
            disabled={!playerName.trim() || !isValidRoomCode(roomCode)}
          >
            Join Lobby
          </button>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => navigate("/")}
          >
            Back
          </button>
        </div>
      </form>
    </section>
  );
}
