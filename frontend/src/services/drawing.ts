type SendFn = (code: string, participantId: string, event: any) => Promise<any>;

export function createCanvasEventSender(
  code: string,
  participantId: string,
  sendFn: SendFn
) {
  let buffer: any[] = [];
  let timer: any = null;
  let stopped = false;

  function flush() {
    if (stopped) return;
    if (buffer.length === 0) return;
    const toSend = buffer.splice(0);
    // send each event sequentially (server appends)
    for (const ev of toSend) {
      // fire and forget
      sendFn(code, participantId, ev).catch(() => {
        // swallow: best-effort
      });
    }
  }

  function schedule() {
    if (timer) return;
    timer = setInterval(() => {
      flush();
    }, 500);
  }

  function send(event: any) {
    buffer.push(event);
    schedule();
    if (buffer.length > 50) {
      flush();
    }
  }

  function stop() {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
    flush();
  }

  return { send, stop };
}

export default createCanvasEventSender;
