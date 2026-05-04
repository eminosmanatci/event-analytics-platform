import { useEffect, useState } from 'react';
import { Users, MousePointer, Calendar, RefreshCw, Eye } from 'lucide-react';
import { analyticsApi, eventApi } from '../lib/api';

interface Event {
  id: number;
  user_id: number;
  event_type: string;
  timestamp: string;
  metadata: Record<string, any> | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeUsers: 0,
    eventTypes: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchData = async () => {
    try {
      const [eventsRes, activeUsersRes, typesRes] = await Promise.all([
        eventApi.getAll({ limit: 10 }),
        analyticsApi.getActiveUsers(30),
        analyticsApi.getEventTypes(),
      ]);

      setStats({
        totalEvents: eventsRes.data.length || 0,
        activeUsers: activeUsersRes.data.active_users || 0,
        eventTypes: typesRes.data.length || 0,
      });
      setRecentEvents(eventsRes.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Her 10 saniyede bir otomatik yenile
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      
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

      {/* Recent Events Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
          <p className="text-sm text-gray-500 mt-1">Auto-refreshes every 10 seconds</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{event.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {event.event_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">ID</label>
                <p className="text-gray-900">#{selectedEvent.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Event Type</label>
                <p className="text-gray-900">{selectedEvent.event_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <p className="text-gray-900">{selectedEvent.user_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Timestamp</label>
                <p className="text-gray-900">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Metadata</label>
                <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-800 overflow-auto">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="mt-6 w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
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