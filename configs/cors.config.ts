const parseAllowList = (raw: string | undefined): string[] => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const defaultAllowList = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const allowList = (() => {
  const fromEnv =
    parseAllowList(process.env.CORS_ORIGINS) ||
    parseAllowList(process.env.FRONTEND_ORIGIN);

  return fromEnv.length ? fromEnv : defaultAllowList;
})();

const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // allow non-browser clients (curl/postman)

  if (allowList.includes(origin)) return true;

  let hostname: string | undefined;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  return allowList.some((entry) => {
    if (entry.startsWith('*.')) {
      const suffix = entry.slice(2);
      return hostname === suffix || hostname.endsWith(`.${suffix}`);
    }
    return false;
  });
};

export const corsConfig = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, ok?: boolean) => void,
  ) => {
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
};
