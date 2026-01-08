const defaultOrigins = ['https://leafpost-front-final.vercel.app'];

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return defaultOrigins;
  const items = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : defaultOrigins;
}

const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);

export const corsConfig = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, ok?: boolean) => void,
  ) => {
    // no Origin: mobile 앱(WebView), 서버-서버, curl 등
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
