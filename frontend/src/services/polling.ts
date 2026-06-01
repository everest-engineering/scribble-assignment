export type Poller = {
  start: () => void;
  stop: () => void;
};

export function createPoller(
  fn: () => Promise<unknown>,
  baseMs = 2000,
  jitterMs = 400
): Poller {
  let stopped = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  async function tick() {
    if (stopped) return;

    try {
      await fn();
    } catch (err) {
      // Swallow errors; consumers can surface state as needed
      // eslint-disable-next-line no-console
      console.debug("poller error", err);
    }

    const jitter = Math.floor((Math.random() * 2 - 1) * jitterMs);
    const next = Math.max(200, baseMs + jitter);

    timeout = setTimeout(() => void tick(), next);
  }

  return {
    start() {
      stopped = false;
      if (!timeout) void tick();
    },
    stop() {
      stopped = true;
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    }
  };
}
