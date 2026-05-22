'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService from '@/lib/auth-service';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    const token = authService.getAccessToken();
    
    if (currentUser && token) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    setUser(result.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Protected route wrapper component
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = authService.getAccessToken();
    const user = authService.getCurrentUser();
    
    // Allow access to login and register pages
    if (pathname === '/login' || pathname === '/register' || pathname === '/api-test') {
      setIsChecking(false);
      return;
    }

    // Redirect to login if not authenticated
    if (!token || !user) {
      console.log('🔒 No auth token found, redirecting to login');
      router.push('/login');
    } else {
      console.log('✅ User authenticated:', user.email);
      setIsChecking(false);
    }
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fef8f3]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#005259] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6f797a] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
