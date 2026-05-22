'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import authService, { type RegisterData, type LoginData } from '@/lib/auth-service';
import customerService, { type CreateCustomerData } from '@/lib/customer-service';
import dashboardService from '@/lib/dashboard-service';

export default function APITestPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading((prev) => ({ ...prev, [testName]: true }));
    setError(null);
    
    try {
      const result = await testFn();
      setResults((prev) => ({ ...prev, [testName]: result }));
      console.log(`✅ ${testName}:`, result);
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      setError(`${testName} failed: ${errorMsg}`);
      console.error(`❌ ${testName}:`, err);
    } finally {
      setLoading((prev) => ({ ...prev, [testName]: false }));
    }
  };

  const testBackendHealth = () => runTest('Backend Health', async () => {
    const response = await fetch('http://localhost:4000/api/v1/health');
    return await response.json();
  });

  const testRegister = () => runTest('Register User', async () => {
    const data: RegisterData = {
      email: `test${Date.now()}@example.com`,
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      tenantName: 'Test Company',
    };
    return await authService.register(data);
  });

  const testLogin = () => runTest('Login User', async () => {
    const data: LoginData = {
      email: 'test@example.com',
      password: 'Test123!@#',
    };
    return await authService.login(data);
  });

  const testCreateCustomer = () => runTest('Create Customer', async () => {
    const data: CreateCustomerData = {
      name: 'Test Customer ' + Date.now(),
      phone: '+1234567890',
      email: 'customer@example.com',
      address: '123 Test St',
      creditProfile: {
        creditLimit: 10000,
        paymentCycle: 30,
        gracePeriod: 7,
        lateFeePercent: 2.5,
      },
    };
    return await customerService.create(data);
  });

  const testGetCustomers = () => runTest('Get Customers', async () => {
    return await customerService.getAll({ limit: 10 });
  });

  const testGetDashboard = () => runTest('Get Dashboard KPIs', async () => {
    return await dashboardService.getKPIs();
  });

  const testLogout = () => {
    authService.logout();
    setResults((prev) => ({ ...prev, 'Logout': 'Logged out successfully' }));
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Backend API Integration Test</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Backend Status</h2>
        <p className="mb-2">Backend URL: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:4000/api/v1</code></p>
        <p className="mb-4">Frontend URL: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3002</code></p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Button 
          onClick={testBackendHealth}
          disabled={loading['Backend Health']}
          className="w-full"
        >
          {loading['Backend Health'] ? 'Testing...' : '🏥 Test Backend Health'}
        </Button>

        <Button 
          onClick={testRegister}
          disabled={loading['Register User']}
          className="w-full"
          variant="outline"
        >
          {loading['Register User'] ? 'Registering...' : '👤 Register New User'}
        </Button>

        <Button 
          onClick={testLogin}
          disabled={loading['Login User']}
          className="w-full"
          variant="outline"
        >
          {loading['Login User'] ? 'Logging in...' : '🔐 Login User'}
        </Button>

        <Button 
          onClick={testCreateCustomer}
          disabled={loading['Create Customer']}
          className="w-full"
          variant="outline"
        >
          {loading['Create Customer'] ? 'Creating...' : '➕ Create Customer'}
        </Button>

        <Button 
          onClick={testGetCustomers}
          disabled={loading['Get Customers']}
          className="w-full"
          variant="outline"
        >
          {loading['Get Customers'] ? 'Loading...' : '📋 Get Customers'}
        </Button>

        <Button 
          onClick={testGetDashboard}
          disabled={loading['Get Dashboard KPIs']}
          className="w-full"
          variant="outline"
        >
          {loading['Get Dashboard KPIs'] ? 'Loading...' : '📊 Get Dashboard'}
        </Button>

        <Button 
          onClick={testLogout}
          className="w-full"
          variant="destructive"
        >
          🚪 Logout
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        <div className="space-y-4">
          {Object.entries(results).map(([key, value]) => (
            <div key={key} className="border-b pb-4 last:border-b-0">
              <h3 className="font-semibold text-green-600 mb-2">✅ {key}</h3>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
          {Object.keys(results).length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No tests run yet. Click a button above to test the API.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Quick Test Sequence</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Click "Test Backend Health" to verify the backend is running</li>
          <li>Click "Register New User" to create a test account</li>
          <li>Click "Login User" with the test credentials (check backend logs for email)</li>
          <li>Click "Create Customer" to test authenticated requests</li>
          <li>Click "Get Customers" to verify data retrieval</li>
          <li>Click "Get Dashboard" to test dashboard endpoints</li>
        </ol>
      </Card>
    </div>
  );
}
