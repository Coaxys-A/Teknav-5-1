import { Logger } from '@/lib/logger';

/**
 * CSRF Frontend Helper
 * 
 * Fetches token and attaches to all mutation requests.
 */

export class CsrfService {
  private static instance: CsrfService;
  private token: string | null = null;
  private logger = new Logger('CsrfService');

  private constructor() {}

  static getInstance(): CsrfService {
    if (!CsrfService.instance) {
      CsrfService.instance = new CsrfService();
    }
    return CsrfService.instance;
  }

  /**
   * Fetch CSRF token
   */
  async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    try {
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      this.token = data.data.token;

      return this.token;
    } catch (error) {
      this.logger.error('Failed to fetch CSRF token:', error);
      throw error;
    }
  }

  /**
   * Attach CSRF token to fetch options
   */
  async attachCsrf<T extends RequestInit | { headers?: Record<string, string> }>(
    options: T,
  ): Promise<T> {
    const token = await this.getToken();

    return {
      ...options,
      headers: {
        ...options.headers,
        'x-csrf-token': token,
      },
    };
  }

  /**
   * Reset token (after login/logout)
   */
  resetToken() {
    this.token = null;
  }
}

export const csrfService = CsrfService.getInstance();
