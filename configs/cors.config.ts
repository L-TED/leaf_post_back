function normalizeOrigin(origin: string): string {
  // Origin header never includes a trailing slash, but env vars often do.
  return origin.trim().replace(/\/$/, '');
}

const defaultOrigins = [
  'https://leafpost-front-final.vercel.app',
  // Optional: allow configuring the front origin in env
  ...(process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : []),
].map(normalizeOrigin);

function parseOrigins(raw: string | undefined): string[] {
  const fromEnv = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  // Merge defaults + env for safer deployments (prevents accidental lock-out)
  const merged = [...defaultOrigins, ...fromEnv];
  return Array.from(new Set(merged));
}

const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);

export const corsConfig = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, ok?: boolean) => void,
  ) => {
    // no Origin: mobile 앱(WebView), 서버-서버, curl 등
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // Some Safari/iOS clients are picky about 204 for preflight.
  optionsSuccessStatus: 200,
};
