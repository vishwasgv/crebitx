'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/navigation/top-nav';
import { Scroll3D, TiltCard } from '@/components/ui/scroll-3d';
import { CollectionChart } from '@/components/dashboard/collection-chart';
import { 
  PlusCircle, 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import authService from '@/lib/auth-service';
import dashboardService from '@/lib/dashboard-service';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = authService.getAccessToken();
    const currentUser = authService.getCurrentUser();
    
    if (!token || !currentUser) {
      console.log('🔒 Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('✅ User authenticated:', currentUser.email);
    setUser(currentUser);

    // Fetch dashboard data
    const fetchDashboard = async () => {
      try {
        const kpis = await dashboardService.getKPIs();
        setData(kpis);
      } catch (error) {
        console.error('❌ Failed to fetch dashboard data:', error);
        // Use mock data for now
        setData({
          totalOutstanding: 185000,
          overdueAmount: 140000,
          thisWeekDue: 45000,
          alerts: [
            { id: 1, message: 'Global Tech Corp - 5 days overdue' },
            { id: 2, message: 'Ravi Textiles - Critical: 12 days overdue' }
          ],
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fef8f3]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#005259] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6f797a] font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !data) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#f9f3ed] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={data.alerts?.length || 0} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        {/* Hero Brief */}
        <Scroll3D>
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1d1b18] leading-[1.1] tracking-tight">
              Welcome back, <br />{user.firstName || user.email}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <div className="bg-[#cae8eb] text-[#005259] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} /> Dashboard
              </div>
              <p className="text-sm font-semibold text-[#6f797a]">
                You have {data.alerts?.length || 0} urgent follow-ups today.
              </p>
            </div>
          </div>
        </Scroll3D>

        {/* KPI Scoreboard */}
        <div className="grid gap-6 md:grid-cols-3">
          <TiltCard className="bg-white rounded-[2rem] p-6 border border-[rgba(190,200,202,0.2)] shadow-ambient">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] mb-2">Total Outstanding</p>
            <h3 className="text-4xl font-extrabold text-[#1d1b18]">{formatCurrency(data.totalOutstanding || 0)}</h3>
            <div className="flex items-center gap-2 mt-3 text-[#005259] text-sm font-bold">
              <TrendingUp size={16} />
              <span>From all customers</span>
            </div>
          </TiltCard>

          <TiltCard className="bg-gradient-to-br from-[#ba1a1a] to-[#d64545] rounded-[2rem] p-6 text-white shadow-ambient">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-2">Overdue Amount</p>
            <h3 className="text-4xl font-extrabold">{formatCurrency(data.overdueAmount || 0)}</h3>
            <div className="flex items-center gap-2 mt-3 text-white/90 text-sm font-bold">
              <AlertTriangle size={16} />
              <span>Requires attention</span>
            </div>
          </TiltCard>

          <TiltCard className="bg-[#cae8eb] rounded-[2rem] p-6 border border-[#005259]/10 shadow-ambient">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#005259] mb-2">This Week Due</p>
            <h3 className="text-4xl font-extrabold text-[#005259]">{formatCurrency(data.thisWeekDue || 0)}</h3>
            <div className="flex items-center gap-2 mt-3 text-[#005259] text-sm font-bold">
              <Zap size={16} />
              <span>Next 7 days</span>
            </div>
          </TiltCard>
        </div>

        {/* Collection Trend */}
        <Scroll3D>
          <div className="bg-white rounded-[2rem] p-8 border border-[rgba(190,200,202,0.2)] shadow-ambient">
            <h3 className="text-xl font-extrabold text-[#1d1b18] mb-6">Collection Trend</h3>
            <CollectionChart />
          </div>
        </Scroll3D>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/customers">
            <TiltCard className="bg-gradient-to-br from-[#005259] to-[#0f6c74] rounded-[2rem] p-6 text-white shadow-ambient hover:shadow-ambient-lg transition-all group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-extrabold mb-2">View Customers</h4>
                  <p className="text-white/80 text-sm font-medium">Manage credit profiles</p>
                </div>
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </TiltCard>
          </Link>

          <Link href="/collections">
            <TiltCard className="bg-white rounded-[2rem] p-6 border border-[rgba(190,200,202,0.2)] shadow-ambient hover:shadow-ambient-lg transition-all group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-extrabold text-[#1d1b18] mb-2">Collections</h4>
                  <p className="text-[#6f797a] text-sm font-medium">Track payments</p>
                </div>
                <ArrowRight size={24} className="text-[#005259] group-hover:translate-x-1 transition-transform" />
              </div>
            </TiltCard>
          </Link>
        </div>

        {/* Alerts */}
        {data.alerts && data.alerts.length > 0 && (
          <Scroll3D>
            <div className="bg-[#ffebee] rounded-[2rem] p-6 border border-[#ba1a1a]/20">
              <h3 className="text-lg font-extrabold text-[#ba1a1a] mb-4 flex items-center gap-2">
                <AlertTriangle size={20} />
                Urgent Follow-ups
              </h3>
              <div className="space-y-3">
                {data.alerts.map((alert: any) => (
                  <div key={alert.id} className="bg-white rounded-xl p-4 text-sm font-medium text-[#1d1b18]">
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
          </Scroll3D>
        )}
      </main>
    </div>
  );
}
