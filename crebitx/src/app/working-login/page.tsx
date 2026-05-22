'use client';

import { useState } from 'react';

export default function WorkingLoginPage() {
  const [email, setEmail] = useState('owner@democorp.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    console.log(msg);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setLogs([]);

    addLog('🔐 Starting login process...');
    addLog(`Email: ${email}`);

    try {
      addLog('📡 Sending POST request to backend...');
      
      const response = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      addLog(`Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      addLog('📦 Received response from backend');
      addLog(`Response: ${JSON.stringify(data.success)}`);

      if (data.success && data.data.accessToken) {
        const { accessToken, refreshToken } = data.data;
        
        addLog('🔑 Decoding JWT token...');
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        addLog(`User ID: ${payload.sub}`);
        addLog(`Email: ${payload.email}`);
        addLog(`Tenant ID: ${payload.tenantId}`);
        addLog(`Role: ${payload.role}`);

        addLog('💾 Storing tokens in localStorage...');
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify({
          id: payload.sub,
          email: payload.email,
          tenantId: payload.tenantId,
          role: payload.role,
        }));

        addLog('✅ Login successful!');
        setMessage('✅ Login successful! Redirecting...');

        setTimeout(() => {
          addLog('🔄 Redirecting to dashboard...');
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      addLog(`❌ Login failed: ${error.message}`);
      setMessage(`❌ Login failed: ${error.message}`);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2">🔐 Working Login</h1>
          <p className="text-center text-gray-600 mb-8">Simple, no-dependencies login test</p>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '🔄 Logging in...' : '🔐 Log In'}
            </button>
          </form>

          {message && (
            <div className={`p-4 rounded-lg mb-4 ${
              message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {logs.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-2">📋 Debug Logs:</h3>
              <div className="space-y-1 text-sm font-mono max-h-64 overflow-y-auto">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes('✅') ? 'text-green-600' :
                      log.includes('❌') ? 'text-red-600' :
                      log.includes('🔐') || log.includes('📡') || log.includes('🔑') ? 'text-blue-600' :
                      'text-gray-700'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium mb-2">ℹ️ This is a simplified login page that:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Uses plain fetch API (no axios, no libraries)</li>
              <li>Shows detailed debug logs</li>
              <li>Stores tokens directly in localStorage</li>
              <li>Redirects to dashboard on success</li>
            </ul>
          </div>

          <div className="mt-4 text-center">
            <a href="/login" className="text-blue-600 hover:underline text-sm">
              ← Back to original login page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
