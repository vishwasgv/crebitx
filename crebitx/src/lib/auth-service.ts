// Auth service using native fetch for reliability

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  role: string;
}

export const authService = {
  /**
   * Register a new user and tenant
   */
  async register(data: RegisterData): Promise<{ user: UserData; tokens: AuthTokens }> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const registerUrl = `${API_URL}/auth/register`;
    
    console.log('📝 auth-service: Registering user:', data.email);
    
    const response = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(errorData.message || `Registration failed with status ${response.status}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      throw new Error('Invalid response format from backend');
    }
    
    const { accessToken, refreshToken } = responseData.data;
    
    // Decode JWT to extract user info
    const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
    const user: UserData = {
      id: decodedToken.sub,
      email: decodedToken.email,
      firstName: decodedToken.firstName || data.firstName,
      lastName: decodedToken.lastName || data.lastName,
      tenantId: decodedToken.tenantId,
      role: decodedToken.role,
    };
    
    // Store tokens and user info
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    console.log('✅ auth-service: Registration successful!');
    return { user, tokens: { accessToken, refreshToken } };
  },

  /**
   * Login existing user
   */
  async login(data: LoginData): Promise<{ user: UserData; tokens: AuthTokens }> {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const loginUrl = `${API_URL}/auth/login`;
      
      console.log('🔐 auth-service: Attempting login for', data.email);
      console.log('📍 auth-service: Using URL:', loginUrl);
      
      // Use native fetch to bypass axios caching issues
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('� auth-service: Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        console.error('❌ auth-service: Login failed:', errorData);
        throw new Error(errorData.message || `Login failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('� auth-service: Response data:', responseData);
      
      if (!responseData.success || !responseData.data) {
        throw new Error('Invalid response format from backend');
      }
      
      const { accessToken, refreshToken } = responseData.data;
      
      if (!accessToken || !refreshToken) {
        throw new Error('No tokens received from backend');
      }
      
      console.log('🔑 auth-service: Tokens received, decoding...');
      
      // Decode JWT to extract user info
      const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
      console.log('📋 auth-service: Decoded token:', decodedToken);
      
      const user: UserData = {
        id: decodedToken.sub,
        email: decodedToken.email,
        firstName: decodedToken.firstName || '',
        lastName: decodedToken.lastName || '',
        tenantId: decodedToken.tenantId,
        role: decodedToken.role,
      };
      
      console.log('👤 auth-service: User data:', user);
      
      // Store tokens and user info
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('💾 auth-service: Tokens stored in localStorage');
      }
      
      console.log('✅ auth-service: Login successful!');
      return { user, tokens: { accessToken, refreshToken } };
      
    } catch (error: any) {
      console.error('❌ auth-service: Login failed:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Throw a clean error message
      throw new Error(error.message || 'Login failed. Please check your credentials and try again.');
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const refreshUrl = `${API_URL}/auth/refresh`;
    
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const responseData = await response.json();
    const { accessToken } = responseData.data;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
    }
    
    return accessToken;
  },

  /**
   * Logout user
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('access_token');
    }
    return false;
  },

  /**
   * Get current user from storage
   */
  getCurrentUser(): UserData | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  },
};

export default authService;
