interface RoomCodeBadgeProps {
  code: string;
  prominent?: boolean;
}

export function RoomCodeBadge({ code, prominent = false }: RoomCodeBadgeProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard unavailable — code remains visible for manual copy
    }
  }

  return (
    <div className={prominent ? "room-code-badge room-code-badge--prominent" : "room-code-badge"}>
      <span className="room-code-badge__label">Room code</span>
      <strong className="room-code-badge__code">{code}</strong>
      {prominent ? (
        <button type="button" className="button button--secondary button--compact" onClick={() => void handleCopy()}>
          Copy code
        </button>
      ) : null}
    </div>
  );
}
