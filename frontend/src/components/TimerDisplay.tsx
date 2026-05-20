import { useEffect, useState } from "react";

interface TimerDisplayProps {
  timerDuration: number;
  timerStartedAt: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TimerDisplay({ timerDuration, timerStartedAt }: TimerDisplayProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    function tick() {
      const elapsed = Date.now() - timerStartedAt;
      setRemaining(Math.max(0, timerDuration * 1000 - elapsed));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerDuration, timerStartedAt]);

  if (timerDuration <= 0) return null;

  const remainingSec = Math.ceil(remaining / 1000);
  const isLow = remainingSec <= 30;

  return (
    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: isLow ? "#dc2626" : "#6b7280" }}>
      {formatTime(remainingSec)}
    </span>
  );
}
