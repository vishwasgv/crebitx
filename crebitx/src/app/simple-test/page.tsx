'use client';

import { useState } from 'react';

export default function SimpleTestPage() {
  const [output, setOutput] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setOutput(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    console.log(msg);
  };

  const testBackend = async () => {
    setOutput([]);
    addLog('🧪 Starting tests...');

    // Test 1: Check if fetch works
    try {
      addLog('Test 1: Testing fetch API...');
      const response = await fetch('http://localhost:4000/api/v1/health');
      const data = await response.json();
      addLog('✅ Test 1 PASSED: Backend is reachable via fetch');
      addLog(`Response: ${JSON.stringify(data.data.status)}`);
    } catch (err: any) {
      addLog(`❌ Test 1 FAILED: ${err.message}`);
      return;
    }

    // Test 2: Test with axios
    try {
      addLog('Test 2: Testing with axios...');
      const axios = require('axios');
      const response = await axios.get('http://localhost:4000/api/v1/health');
      addLog('✅ Test 2 PASSED: Backend is reachable via axios');
    } catch (err: any) {
      addLog(`❌ Test 2 FAILED: ${err.message}`);
      return;
    }

    // Test 3: Test login with fetch
    try {
      addLog('Test 3: Testing login with fetch...');
      const response = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@democorp.com',
          password: 'Password123!'
        })
      });
      const data = await response.json();
      if (data.data.accessToken) {
        addLog('✅ Test 3 PASSED: Login successful with fetch');
        addLog(`Token: ${data.data.accessToken.substring(0, 30)}...`);
      } else {
        addLog('❌ Test 3 FAILED: No token received');
      }
    } catch (err: any) {
      addLog(`❌ Test 3 FAILED: ${err.message}`);
      return;
    }

    // Test 4: Test login with axios
    try {
      addLog('Test 4: Testing login with axios...');
      const axios = require('axios');
      const response = await axios.post('http://localhost:4000/api/v1/auth/login', {
        email: 'owner@democorp.com',
        password: 'Password123!'
      });
      if (response.data.data.accessToken) {
        addLog('✅ Test 4 PASSED: Login successful with axios');
      } else {
        addLog('❌ Test 4 FAILED: No token received');
      }
    } catch (err: any) {
      addLog(`❌ Test 4 FAILED: ${err.message}`);
      return;
    }

    // Test 5: Test with api.ts
    try {
      addLog('Test 5: Testing with api.ts wrapper...');
      const { default: api } = await import('@/lib/api');
      const response = await api.post('/auth/login', {
        email: 'owner@democorp.com',
        password: 'Password123!'
      });
      if (response.data.data.accessToken) {
        addLog('✅ Test 5 PASSED: Login successful with api.ts');
      } else {
        addLog('❌ Test 5 FAILED: No token received');
      }
    } catch (err: any) {
      addLog(`❌ Test 5 FAILED: ${err.message}`);
      return;
    }

    // Test 6: Test with authService
    try {
      addLog('Test 6: Testing with authService...');
      const { default: authService } = await import('@/lib/auth-service');
      const result = await authService.login({
        email: 'owner@democorp.com',
        password: 'Password123!'
      });
      if (result.tokens.accessToken) {
        addLog('✅ Test 6 PASSED: Login successful with authService');
        addLog(`User: ${result.user.email}`);
        addLog('✅✅✅ ALL TESTS PASSED! Login is working!');
      } else {
        addLog('❌ Test 6 FAILED: No token received');
      }
    } catch (err: any) {
      addLog(`❌ Test 6 FAILED: ${err.message}`);
      addLog(`Error details: ${JSON.stringify(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">🔍 Simple Login Diagnostic</h1>
        
        <div className="mb-6">
          <button
            onClick={testBackend}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            🧪 Run All Tests
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-bold mb-3">Test Output:</h2>
          {output.length === 0 ? (
            <p className="text-gray-500">Click "Run All Tests" to start</p>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {output.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.includes('✅') ? 'text-green-600' :
                    line.includes('❌') ? 'text-red-600' :
                    'text-gray-700'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-2">What This Tests:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Can we reach the backend with fetch?</li>
            <li>Can we reach the backend with axios?</li>
            <li>Can we login with fetch?</li>
            <li>Can we login with axios?</li>
            <li>Can we login with our api.ts wrapper?</li>
            <li>Can we login with our authService?</li>
          </ol>
          <p className="mt-3 text-sm text-blue-800">
            If all tests pass, the login functionality is working correctly.
            If any test fails, we'll see exactly where the problem is.
          </p>
        </div>
      </div>
    </div>
  );
}
