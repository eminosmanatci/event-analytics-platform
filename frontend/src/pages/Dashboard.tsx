import { useEffect, useState, useCallback } from 'react';
import {
  MousePointer,
  Users,
  Calendar,
  RefreshCw,
  Eye,
  Activity,
  Clock,
  Zap,
  Search,
  ChevronLeft,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { analyticsApi, eventApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom'; // Eklendi
import { StatCard } from '../components/StatCard';
import { EventsOverTimeChart, EventTypesChart } from '../components/EventChart';
import { ThemeToggle } from '../components/ThemeToggle';
import { StatCardSkeleton, TableSkeleton } from '../components/Skeleton';
import { cn } from '../lib/utils';

interface Event {
  id: number;
  user_id: number;
  event_type: string;
  timestamp: string;
  metadata: Record<string, any> | null;
}

const ITEMS_PER_PAGE = 10;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Mevcut yolu izlemek için eklendi

  const [stats, setStats] = useState({
    totalEvents: 0,
    activeUsers: 0,
    eventTypes: 0,
    todayEvents: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchData = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true);
      const [eventsRes, activeUsersRes, typesRes, todayRes] = await Promise.all([
        eventApi.getAll({ limit: 100 }),
        analyticsApi.getActiveUsers(30),
        analyticsApi.getEventTypes(),
        analyticsApi.getDailyEvents(1),
      ]);

      const allEvents = eventsRes.data || [];
      
      setStats({
        totalEvents: allEvents.length,
        activeUsers: activeUsersRes.data?.active_users || 0,
        eventTypes: typesRes.data?.length || 0,
        todayEvents: todayRes.data?.[0]?.count || 0,
      });
      setRecentEvents(allEvents);
      
      if (showToast) {
        toast.success('Dashboard refreshed successfully');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('Logged out successfully');
  };

  const filteredEvents = recentEvents.filter(event =>
    event.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.user_id.toString().includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      login: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      logout: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      click: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      view: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      purchase: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      error: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    };
    return colors[type.toLowerCase()] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 h-full bg-card border-r border-border z-40 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-foreground">Event Analytics</h1>
                  <p className="text-xs text-muted-foreground">v1.0.0</p>
                </div>
              </div>

              {/* Güncellenmiş Navigasyon Kısmı */}
              <nav className="space-y-1">
                <SidebarItem 
                  icon={<BarChart3 className="w-4 h-4" />} 
                  label="Dashboard" 
                  path="/dashboard" 
                  active={location.pathname === '/dashboard'} 
                />
                <SidebarItem 
                  icon={<MousePointer className="w-4 h-4" />} 
                  label="Events" 
                  path="/events" 
                  active={location.pathname === '/events'} 
                />
                <SidebarItem icon={<Users className="w-4 h-4" />} label="Users" />
                <SidebarItem icon={<Zap className="w-4 h-4" />} label="Analytics" />
                <SidebarItem icon={<Clock className="w-4 h-4" />} label="Real-time" />
              </nav>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {user?.username?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-[260px]" : "ml-0")}>
        <header className="sticky top-0 z-30 glass border-b border-border">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
              </button>
              <h2 className="text-xl font-semibold text-foreground">Dashboard Overview</h2>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all",
                  refreshing && "opacity-50"
                )}
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-[1600px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
            ) : (
              <>
                <StatCard title="Total Events" value={stats.totalEvents} icon={<MousePointer className="w-5 h-5" />} trend={12} trendLabel="vs last month" color="blue" delay={0} />
                <StatCard title="Active Users" value={stats.activeUsers} icon={<Users className="w-5 h-5" />} trend={8} trendLabel="vs last month" color="green" delay={0.1} />
                <StatCard title="Event Types" value={stats.eventTypes} icon={<Calendar className="w-5 h-5" />} color="purple" delay={0.2} />
                <StatCard title="Today's Events" value={stats.todayEvents} icon={<Zap className="w-5 h-5" />} trend={-3} trendLabel="vs yesterday" color="orange" delay={0.3} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">Events Over Time</h3>
              <EventsOverTimeChart />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">Event Types Distribution</h3>
              <EventTypesChart />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Recent Events</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Auto-refreshes every 30 seconds • {filteredEvents.length} total events • Sayfa {currentPage} / {totalPages}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
                    />
                  </div>
                </div>
              </div>
            </div>

            {loading ? <TableSkeleton /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <AnimatePresence>
                      {paginatedEvents.map((event, index) => (
                        <motion.tr key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: index * 0.05 }} className="hover:bg-muted/50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">#{event.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", getEventTypeColor(event.event_type))}>
                              {event.event_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{event.user_id}</div>
                              <span>User #{event.user_id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{new Date(event.timestamp).toLocaleString('tr-TR')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button onClick={() => setSelectedEvent(event)} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4" /> View
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl shadow-2xl max-w-lg w-full border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Event Details</h3>
                  <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">✕</button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <DetailRow label="ID" value={`#${selectedEvent.id}`} />
                <DetailRow label="Event Type" value={<span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", getEventTypeColor(selectedEvent.event_type))}>{selectedEvent.event_type}</span>} />
                <DetailRow label="User ID" value={selectedEvent.user_id} />
                <DetailRow label="Timestamp" value={new Date(selectedEvent.timestamp).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'medium' })} />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metadata</label>
                  <div className="mt-2 p-4 bg-muted rounded-xl border border-border">
                    <pre className="text-xs text-foreground overflow-auto max-h-60 font-mono">{JSON.stringify(selectedEvent.metadata, null, 2)}</pre>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border bg-muted/30">
                <button onClick={() => setSelectedEvent(null)} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// SidebarItem Bileşeni
function SidebarItem({ 
  icon, 
  label, 
  path, 
  active = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  path?: string;
  active?: boolean;
}) {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => path && navigate(path)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">{label}</label>
      <div className="text-sm text-foreground font-medium text-right">{value}</div>
    </div>
  );
}