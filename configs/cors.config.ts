function normalizeOrigin(origin: string): string {
  // Origin header never includes a trailing slash, but env vars often do.
  return origin.trim().replace(/\/$/, '');
}

function tryParseOrigin(origin: string): URL | undefined {
  try {
    return new URL(origin);
  } catch {
    return undefined;
  }
}

function parseWildcardPattern(
  pattern: string,
): { scheme?: string; hostSuffix: string } | undefined {
  const raw = pattern.trim();
  if (!raw) return undefined;

  // Supported examples:
  // - *.vercel.app
  // - https://*.vercel.app
  const hasScheme = raw.includes('://');
  const [scheme, hostPattern] = hasScheme ? raw.split('://', 2) : ['', raw];
  const host = (hostPattern || '').trim();
  if (!host.startsWith('*.')) return undefined;
  const hostSuffix = host.slice(1); // keep leading dot: .vercel.app
  if (!hostSuffix.startsWith('.') || hostSuffix.length < 3) return undefined;

  return {
    scheme: hasScheme ? scheme.toLowerCase() : undefined,
    hostSuffix: hostSuffix.toLowerCase(),
  };
}

function isOriginAllowed(origin: string, allowList: string[]): boolean {
  const normalized = normalizeOrigin(origin);
  if (allowList.includes(normalized)) return true;

  const url = tryParseOrigin(normalized);
  if (!url) return false;

  const hostname = url.hostname.toLowerCase();
  const scheme = url.protocol.replace(':', '').toLowerCase();

  for (const item of allowList) {
    const wildcard = parseWildcardPattern(item);
    if (!wildcard) continue;
    if (wildcard.scheme && wildcard.scheme !== scheme) continue;

    // must be a subdomain match (a.vercel.app), not the apex (vercel.app)
    if (
      hostname.endsWith(wildcard.hostSuffix) &&
      hostname !== wildcard.hostSuffix.slice(1)
    ) {
      return true;
    }
  }

  return false;
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

    if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);

    // Helps debug device-specific failures (e.g., iOS opening via a different Vercel preview domain)
    // eslint-disable-next-line no-console
    console.warn('[CORS] Blocked origin:', origin, 'Allowed:', allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  // Some Safari/iOS clients are picky about 204 for preflight.
  optionsSuccessStatus: 200,
};
