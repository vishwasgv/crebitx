'use client';

import { useState } from 'react';
import authService from '@/lib/auth-service';

export default function TestLoginPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    console.log('🧪 Starting test login...');
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('📡 Calling authService.login...');
      const loginResult = await authService.login({
        email: 'owner@democorp.com',
        password: 'Password123!',
      });
      
      console.log('✅ Login successful:', loginResult);
      setResult(loginResult);
      
      // Check localStorage
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const user = localStorage.getItem('user');
      
      console.log('📦 LocalStorage tokens:', {
        accessToken: accessToken?.substring(0, 20) + '...',
        refreshToken: refreshToken?.substring(0, 20) + '...',
        user: user,
      });

      // Try to redirect
      setTimeout(() => {
        console.log('🔄 Redirecting to dashboard...');
        window.location.href = '/dashboard';
      }, 2000);

    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Login Test Page</h1>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            This page tests the login functionality directly.
          </p>
          <p className="text-sm text-gray-600">
            Credentials: owner@democorp.com / Password123!
          </p>
        </div>

        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing Login...' : '🧪 Test Login'}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">❌ Error</h3>
            <pre className="text-sm text-red-600">{error}</pre>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ Success!</h3>
            <p className="text-sm text-green-700 mb-3">
              Logged in as: {result.user.email}
            </p>
            <p className="text-sm text-green-700 mb-3">
              Redirecting to dashboard in 2 seconds...
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-green-800">
                View Response Data
              </summary>
              <pre className="mt-2 text-xs bg-white p-3 rounded overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">📋 Instructions</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Open browser DevTools (F12)</li>
            <li>Go to Console tab</li>
            <li>Click "Test Login" button</li>
            <li>Watch console logs and check for errors</li>
            <li>Should redirect to dashboard after 2 seconds</li>
          </ol>
        </div>

        <div className="mt-4">
          <a href="/login" className="text-blue-600 hover:underline text-sm">
            ← Back to Login Page
          </a>
        </div>
      </div>
    </div>
  );
}
