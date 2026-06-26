interface CanvasPlaceholderProps {
  isDrawer: boolean;
  drawerName: string | null;
  secretWord?: string | null;
}

export function CanvasPlaceholder({ isDrawer, drawerName, secretWord }: CanvasPlaceholderProps) {
  return (
    <div
      className="canvas-placeholder"
      style={{
        minHeight: "500px",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px"
      }}
    >
      {isDrawer ? (
        <>
          <p style={{ fontSize: "18px", fontWeight: 600, color: "#374151" }}>
            You are the drawer!
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Draw your word here:
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, color: "#7c3aed", letterSpacing: "2px" }}>
            {secretWord ?? "???"}
          </p>
        </>
      ) : (
        <p style={{ fontSize: "18px", fontWeight: 600, color: "#374151" }}>
          Waiting for {drawerName ?? "the drawer"} to draw...
        </p>
      )}
    </div>
  );
}
