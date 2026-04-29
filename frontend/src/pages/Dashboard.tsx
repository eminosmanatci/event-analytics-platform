import { useEffect, useState } from 'react';
import { TrendingUp, Users, MousePointer, Calendar } from 'lucide-react';
import { analyticsApi, eventApi } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeUsers: 0,
    eventTypes: 0,
    recentEvents: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [eventsRes, activeUsersRes, typesRes] = await Promise.all([
          eventApi.getAll({ limit: 1 }),
          analyticsApi.getActiveUsers(30),
          analyticsApi.getEventTypes(),
        ]);

        setStats({
          totalEvents: eventsRes.data.length || 0,
          activeUsers: activeUsersRes.data.active_users || 0,
          eventTypes: typesRes.data.length || 0,
          recentEvents: [],
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={<MousePointer className="w-6 h-6 text-blue-600" />}
          trend="+12%"
        />
        <StatCard
          title="Active Users (30d)"
          value={stats.activeUsers}
          icon={<Users className="w-6 h-6 text-green-600" />}
          trend="+5%"
        />
        <StatCard
          title="Event Types"
          value={stats.eventTypes}
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          trend="+3"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-gray-500">Go to Analytics page to see detailed charts and data.</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string; value: number; icon: React.ReactNode; trend: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
}