import { Card } from "./Card";

interface HostDisconnectedBannerProps {
  onClaimHost: () => void;
}

export function HostDisconnectedBanner({ onClaimHost }: HostDisconnectedBannerProps) {
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
        <Card title="Host Disconnected">
          <div style={{ padding: "12px 0" }}>
            <p>The host has disconnected. Would you like to claim host and take over?</p>
          </div>
          <div className="button-row" style={{ marginTop: "16px" }}>
            <button className="button button--primary" onClick={onClaimHost}>
              Claim Host
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
