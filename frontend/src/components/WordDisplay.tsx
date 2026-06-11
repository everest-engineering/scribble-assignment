interface WordDisplayProps {
  secretWord?: string;
}

export function WordDisplay({ secretWord }: WordDisplayProps) {
  if (!secretWord) {
    return null;
  }

  return (
    <div className="word-display">
      <span className="word-display__label">Draw this word:</span>
      <span className="word-display__word">{secretWord}</span>
    </div>
  );
}
