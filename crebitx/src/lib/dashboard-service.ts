import api from './api';

export interface DashboardKPIs {
  outstandingAmount: number;
  overdueAmount: number;
  inflowAmount: number;
  topCustomers: Array<{ name: string; amount: number }>;
  alerts: Array<{ name: string; amount: number; overdue: string; phone: string }>;
}

export interface ChartData {
  collectionTrend: Array<{ date: string; collected: number; target: number }>;
  categoryBreakdown: Array<{ category: string; amount: number; count: number }>;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const dashboardService = {
  /**
   * Get dashboard KPIs
   */
  async getKPIs(): Promise<DashboardKPIs> {
    const response = await api.get('/dashboard/kpis');
    return response.data.data;
  },

  /**
   * Get chart data
   */
  async getCharts(period?: 'week' | 'month' | 'quarter' | 'year'): Promise<ChartData> {
    const response = await api.get('/dashboard/charts', {
      params: { period },
    });
    return response.data.data;
  },

  /**
   * Get recent activity
   */
  async getActivity(limit: number = 10): Promise<Activity[]> {
    const response = await api.get('/dashboard/activity', {
      params: { limit },
    });
    return response.data.data;
  },
};

export default dashboardService;
