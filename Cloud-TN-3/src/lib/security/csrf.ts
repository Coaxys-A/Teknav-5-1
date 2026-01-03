/**
 * CSRF Frontend Helper
 *
 * Fetches CSRF token from backend (usually via GET /csrf or embedded in HTML).
 * Attaches token as header in API calls for state-changing methods.
 */

let csrfToken: string | null = null;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Get CSRF Token
 * Reads from cookie or fetches from backend.
 */
export async function getCsrfToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Try to read from cookie
  const match = document.cookie.match(new RegExp(`(^| )${CSRF_COOKIE_NAME}=([^;]+)`));
  if (match) {
    csrfToken = match[2];
    return csrfToken;
  }

  // 2. If not in cookie, fetch from backend
  // Assuming endpoint /api/auth/csrf exists
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/csrf`);
    const data = await response.json();
    if (data && data.token) {
      csrfToken = data.token;
      return csrfToken;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }

  return null;
}

/**
 * Attach CSRF Token to Headers
 * Called by api-client before fetch.
 */
export function attachCsrfToken(options: RequestInit): RequestInit {
  if (!csrfToken) {
    return options;
  }

  const headers = new Headers(options.headers);
  headers.append(CSRF_HEADER_NAME, csrfToken);

  return {
    ...options,
    headers,
  };
}

/**
 * Clear CSRF Token
 * Used on logout.
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}
