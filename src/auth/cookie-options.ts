import type { CookieOptions } from 'express';

function normalizeCookieDomain(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // Allow users to accidentally pass a URL (e.g. https://api.example.com)
  const noProtocol = trimmed.replace(/^https?:\/\//i, '');
  const noPath = noProtocol.split('/')[0];
  return noPath || undefined;
}

function toBoolean(raw: string | undefined): boolean | undefined {
  if (!raw) return undefined;
  const value = raw.trim().toLowerCase();
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

export function getAuthCookieBaseOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  // Default: secure cookies in production.
  // Override with COOKIE_SECURE=true/false when needed.
  let secure = toBoolean(process.env.COOKIE_SECURE) ?? isProduction;

  // Default: SameSite=None when secure (cross-site), else Lax for local HTTP.
  let sameSite =
    (process.env.COOKIE_SAMESITE as CookieOptions['sameSite']) ??
    (secure ? 'none' : 'lax');

  // Browsers reject SameSite=None without Secure.
  if (sameSite === 'none') secure = true;

  const domain = normalizeCookieDomain(process.env.COOKIE_DOMAIN);

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
    ...(domain ? { domain } : null),
  };
}

export function getAccessTokenCookieOptions(): CookieOptions {
  return {
    ...getAuthCookieBaseOptions(),
    maxAge: 15 * 60 * 1000,
  };
}

export function getRefreshTokenCookieOptions(): CookieOptions {
  return {
    ...getAuthCookieBaseOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function getClearAuthCookieOptions(): CookieOptions {
  // clearCookie needs the same path/domain/samesite/secure to match
  return {
    ...getAuthCookieBaseOptions(),
  };
}
