import type { AddressInfo } from "net";
import type { Server } from "http";
import { createApp } from "../../src/app.js";

export async function startTestServer(): Promise<{
  url: string;
  close: () => Promise<void>;
  server: Server;
}> {
  const app = createApp();
  const server = app.listen(0);

  await new Promise<void>((resolve) =>
    server.once("listening", () => resolve())
  );

  const addr = server.address() as AddressInfo;
  const port = addr.port;
  const url = `http://127.0.0.1:${port}`;

  return {
    url,
    server,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      })
  };
}
