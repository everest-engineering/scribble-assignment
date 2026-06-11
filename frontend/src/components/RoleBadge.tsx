import type { ParticipantRole } from "../services/api";

interface RoleBadgeProps {
  role?: ParticipantRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  if (!role) return null;

  return (
    <span className={`role-badge role-badge--${role}`}>
      {role === "drawer" ? "Drawing" : "Guessing"}
    </span>
  );
}
