import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

console.log('🔧 API Client initialized with base URL:', API_URL);

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false, // Changed to false - backend doesn't use cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

console.log('✅ Axios instance created with config:', {
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  headers: api.defaults.headers,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Added auth token to request');
      } else {
        console.log('ℹ️ No auth token in localStorage');
      }
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Return the data directly if it has the standard structure
    if (response.data?.success !== undefined) {
      return response;
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      responseData: error.response?.data,
    });

    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest) {
      // Try to refresh token
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          try {
            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = response.data.data;
            localStorage.setItem('access_token', accessToken);

            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token, redirect to login
          localStorage.removeItem('access_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;
