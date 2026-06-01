import { useState } from "react";

interface WordSelectionProps {
  wordOptions: string[];
  onSelect: (word: string) => void;
  isLoading: boolean;
}

export function WordSelection({ wordOptions, onSelect, isLoading }: WordSelectionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (word: string) => {
    setSelected(word);
    onSelect(word);
  };

  return (
    <div className="word-selection">
      <h3>Select a word to draw</h3>
      <div className="word-options" style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
        {wordOptions.map((word) => (
          <button
            key={word}
            className="button button--primary"
            disabled={isLoading || selected !== null}
            onClick={() => handleSelect(word)}
          >
            {word}
          </button>
        ))}
      </div>
      {isLoading && <p style={{ marginTop: "12px" }}>Selecting...</p>}
    </div>
  );
}
