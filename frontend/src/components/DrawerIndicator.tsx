import type { Participant } from "../services/api";

interface DrawerIndicatorProps {
  drawerId: string | null;
  currentParticipantId: string | null;
  participants: Participant[];
}

export function DrawerIndicator({ drawerId, currentParticipantId, participants }: DrawerIndicatorProps) {
  if (!drawerId) return null;

  const isDrawer = currentParticipantId === drawerId;
  const drawer = participants.find((p) => p.id === drawerId);

  return (
    <div className={`drawer-indicator ${isDrawer ? "drawer-indicator--self" : ""}`}>
      {isDrawer ? (
        <>
          <span className="drawer-indicator__icon">&#9998;</span>
          <span className="drawer-indicator__text">You are the drawer!</span>
        </>
      ) : (
        <>
          <span className="drawer-indicator__icon">&#128064;</span>
          <span className="drawer-indicator__text">Drawer: <strong>{drawer?.name ?? "Unknown"}</strong></span>
        </>
      )}
    </div>
  );
}
