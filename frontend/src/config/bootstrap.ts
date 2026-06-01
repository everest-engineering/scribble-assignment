export type AppConfig = {
  apiUrl: string;
  drawingEnabled: boolean;
};

function coerceBool(v: any) {
  return v === true || v === "true" || v === "1";
}

export async function bootstrapConfig(): Promise<AppConfig> {
  const env: any = import.meta.env || {};
  const config: any = {
    apiUrl: env.VITE_API_URL ?? "",
    drawingEnabled: coerceBool(env.VITE_FEATURE_DRAWING_ENABLED)
  };

  if (import.meta.env.DEV) {
    try {
      const res = await fetch("/config.json");
      if (res.ok) {
        const json = await res.json();
        if (json.VITE_API_URL) config.apiUrl = json.VITE_API_URL;
        if (typeof json.VITE_FEATURE_DRAWING_ENABLED !== "undefined") {
          config.drawingEnabled = coerceBool(json.VITE_FEATURE_DRAWING_ENABLED);
        }
      }
    } catch (e) {
      // ignore fetch errors for missing runtime override
    }
  }

  // Expose on window for easy access in the app
  try {
    (window as any).__APP_CONFIG = config;
  } catch (e) {}

  return config as AppConfig;
}

export default bootstrapConfig;
