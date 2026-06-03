interface DrawerWordDisplayProps {
  word: string | null;
}

export function DrawerWordDisplay({ word }: DrawerWordDisplayProps) {
  if (!word) return null;

  return (
    <div className="drawer-word-display">
      <span className="drawer-word-display__label">Your word:</span>
      <span className="drawer-word-display__word">{word}</span>
    </div>
  );
}
