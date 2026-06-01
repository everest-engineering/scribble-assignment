import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  if (room?.status !== "drawing") {
    return null;
  }

  return (
    <Card title="Round Status">
      <p className="status-line">Round in progress — results appear when someone guesses correctly.</p>
    </Card>
  );
}
