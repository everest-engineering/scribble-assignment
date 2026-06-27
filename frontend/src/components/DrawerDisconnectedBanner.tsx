import { Card } from "./Card";

interface DrawerDisconnectedBannerProps {
  onNotifyHost: () => void;
}

export function DrawerDisconnectedBanner({ onNotifyHost }: DrawerDisconnectedBannerProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 200,
        overflowY: "auto",
        padding: "16px"
      }}
    >
      <div style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <Card title="Drawer Disconnected">
          <div style={{ padding: "12px 0" }}>
            <p>The drawer has disconnected. Notify the host to skip this round.</p>
          </div>
          <div className="button-row" style={{ marginTop: "16px" }}>
            <button className="button button--primary" onClick={onNotifyHost}>
              Notify Host
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
