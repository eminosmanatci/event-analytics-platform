import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyticsApi } from '../lib/api';
import Layout from '../components/Layout';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [dailyEvents, setDailyEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [activeUsers, setActiveUsers] = useState({ active_users: 0, period_days: 7 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dailyRes, typesRes, usersRes] = await Promise.all([
          analyticsApi.getDailyEvents(30),
          analyticsApi.getEventTypes(),
          analyticsApi.getActiveUsers(7),
        ]);

        setDailyEvents(dailyRes.data);
        
        // --- GÜNCEL VERİ DÖNÜŞÜMÜ ---
        // API'den gelen veriyi Recharts'ın beklediği name/value yapısına çeviriyoruz
        const normalizedTypes = typesRes.data.map((item: any) => ({
          name: item.type || item.event_type || 'Unknown', 
          value: item.count,
        }));
        setEventTypes(normalizedTypes);
        // -----------------------------

        setActiveUsers(usersRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>

        {/* Active Users Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-primary-600">{activeUsers.active_users}</p>
          <p className="text-sm text-gray-500">in the last {activeUsers.period_days} days</p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Events Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Events (30 days)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyEvents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event Types Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // Artık 'name' ve 'percent' parametreleri doğru şekilde eşleşecek
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value" 
                    nameKey="name"
                  >
                    {eventTypes.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}