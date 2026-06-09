import { useState } from "react";
import { Card } from "../components/Card";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function DrawerWordSelect() {
  const roomStore = useRoomStore();
  const { room } = useRoomState();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectWord(word: string) {
    try {
      setError(null);
      setSelectedWord(word);
      await roomStore.selectWord(word);
    } catch (caughtError) {
      setSelectedWord(null);
      setError(caughtError instanceof Error ? caughtError.message : "Failed to select word");
    }
  }

  if (!room || !room.wordOptions) {
    return null;
  }

  if (selectedWord && room.secretWord) {
    return (
      <Card title="Your Secret Word">
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Draw this word:</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{room.secretWord}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Select Your Word">
      <p style={{ marginBottom: '16px', color: '#6b7280' }}>
        Choose a word to draw. The other players will try to guess it.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {room.wordOptions.map((word) => (
          <button
            key={word}
            className="button button--primary"
            style={{ padding: '16px', fontSize: '18px' }}
            disabled={selectedWord !== null}
            onClick={() => handleSelectWord(word)}
          >
            {word}
          </button>
        ))}
      </div>
      {error ? <p className="form__error" style={{ marginTop: '8px' }}>{error}</p> : null}
    </Card>
  );
}
