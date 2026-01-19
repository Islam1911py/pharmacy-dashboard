import type { AuthTokens } from '@/store/auth';

const API_BASE_URL = '';

// Get auth headers - reads from localStorage directly to avoid client-side hook issue
export function getAuthHeaders() {
  if (typeof window === 'undefined') {
    return {
      'Content-Type': 'application/json',
    };
  }

  try {
    // Try to read from localStorage
    const authStorage = localStorage.getItem('pharmacy-auth-storage');
    console.log('📦 localStorage keys:', Object.keys(localStorage));
    
    if (authStorage) {
      const parsedAuth = JSON.parse(authStorage);
      console.log('📖 Parsed auth structure:', {
        hasState: !!parsedAuth.state,
        hasTokens: !!parsedAuth.state?.tokens,
        hasAccessToken: !!parsedAuth.state?.tokens?.accessToken,
      });
      
      const tokens: AuthTokens = parsedAuth.state?.tokens;
      
      if (tokens?.accessToken) {
        console.log('✅ Token found:', tokens.accessToken.substring(0, 20) + '...');
        return {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        };
      } else {
        console.warn('⚠️ No accessToken in storage. State:', parsedAuth.state);
      }
    } else {
      console.warn('⚠️ pharmacy-auth-storage not found in localStorage');
      console.log('📝 All localStorage contents:', { ...localStorage });
    }
  } catch (error) {
    console.error('❌ Error reading auth storage:', error);
  }

  console.log('🚫 No token available, returning empty headers');
  return {
    'Content-Type': 'application/json',
  };
}

// Generic API request function
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data;
}

// API methods
export const api = {
  get: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body: any) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body: any) =>
    apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
