"use client"

import { useState } from 'react'

export default function NetworkTestPage() {
  const [results, setResults] = useState<any[]>([])

  const addResult = (test: string, success: boolean, data: any) => {
    setResults(prev => [...prev, { test, success, data, time: new Date().toLocaleTimeString() }])
  }

  const testDirectFetch = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/health')
      const data = await response.json()
      addResult('Direct Fetch (Health)', true, data)
    } catch (error: any) {
      addResult('Direct Fetch (Health)', false, error.message)
    }
  }

  const testLoginFetch = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@test.com',
          password: 'Password@123'
        })
      })
      const data = await response.json()
      addResult('Login Fetch', true, data)
    } catch (error: any) {
      addResult('Login Fetch', false, error.message)
    }
  }

  const testAxios = async () => {
    try {
      const axios = (await import('axios')).default
      const response = await axios.post('http://localhost:4000/api/v1/auth/login', {
        email: 'newuser@test.com',
        password: 'Password@123'
      })
      addResult('Axios Direct', true, response.data)
    } catch (error: any) {
      addResult('Axios Direct', false, {
        message: error.message,
        code: error.code,
        response: error.response?.data
      })
    }
  }

  const testApiModule = async () => {
    try {
      const { api } = await import('@/lib/api')
      const response = await api.post('/auth/login', {
        email: 'newuser@test.com',
        password: 'Password@123'
      })
      addResult('API Module', true, response.data)
    } catch (error: any) {
      addResult('API Module', false, {
        message: error.message,
        code: error.code
      })
    }
  }

  const testAuthService = async () => {
    try {
      const authService = await import('@/lib/auth-service')
      const result = await authService.default.login({
        email: 'newuser@test.com',
        password: 'Password@123'
      })
      addResult('Auth Service', true, result)
    } catch (error: any) {
      addResult('Auth Service', false, error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Network Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Tests</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={testDirectFetch} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Test Direct Fetch
            </button>
            <button onClick={testLoginFetch} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Test Login Fetch
            </button>
            <button onClick={testAxios} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              Test Axios Direct
            </button>
            <button onClick={testApiModule} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
              Test API Module
            </button>
            <button onClick={testAuthService} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              Test Auth Service
            </button>
            <button onClick={() => setResults([])} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Clear Results
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a button above to start testing.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, i) => (
                <div key={i} className={`p-4 rounded border-l-4 ${result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{result.test}</h3>
                    <span className="text-xs text-gray-500">{result.time}</span>
                  </div>
                  <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </div>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Environment Info</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
            <p><strong>Window location:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
