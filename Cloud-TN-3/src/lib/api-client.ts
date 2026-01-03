/**
 * API Client
 *
 * Centralized API client for making HTTP requests to the backend.
 * Wraps fetch to handle errors, auth, etc.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Generic fetch wrapper
 */
async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem('token'); // Get auth token

  const headers = new Headers(options.headers as HeadersInit);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  // Default to JSON content type if not set
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }

  return response;
}

/**
 * API methods
 */
export const api = {
  /**
   * GET request
   */
  async get<T = any>(url: string, options: RequestInit = {}): Promise<{ data: T; total?: number }> {
    const response = await apiFetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: 'GET',
    });

    const data = await response.json();
    return data;
  },

  /**
   * POST request
   */
  async post<T = any>(url: string, body: any, options: RequestInit = {}): Promise<{ data: T }> {
    const response = await apiFetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data;
  },

  /**
   * PUT request
   */
  async put<T = any>(url: string, body: any, options: RequestInit = {}): Promise<{ data: T }> {
    const response = await apiFetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data;
  },

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, body: any, options: RequestInit = {}): Promise<{ data: T }> {
    const response = await apiFetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data;
  },

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options: RequestInit = {}): Promise<{ data: T }> {
    const response = await apiFetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: 'DELETE',
    });

    const data = await response.json();
    return data;
  },
};

export default api;
