const API = "http://localhost:3001";
async function run() {
  const r1 = await fetch(API + "/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerName: "Host" }) });
  const data = await r1.json();
  const code = data.room.code;
  const pId = data.participantId;
  console.log("Created:", code, pId);

  for (let i = 0; i < 5; i++) {
    const query = "?participantId=" + encodeURIComponent(pId);
    const r2 = await fetch(API + "/rooms/" + code + query);
    const data2 = await r2.json();
    console.log("Poll " + i + " viewerIsHost:", data2.room.viewerIsHost);
  }
}
run();
