import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomStore } from "../state/roomStore";

export function LeaveButton() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    try {
      await roomStore.leaveRoom();
      navigate("/", { replace: true });
    } catch {
      setIsLeaving(false);
    }
  }, [navigate, roomStore]);

  return (
    <button className="button button--secondary" disabled={isLeaving} onClick={handleLeave}>
      {isLeaving ? "Leaving..." : "Leave Room"}
    </button>
  );
}
