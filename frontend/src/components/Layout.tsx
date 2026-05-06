import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BarChart3,
  MousePointer,
  Users,
  Zap,
  Clock,
  ChevronLeft,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function Layout({ children, title, onRefresh, refreshing }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <BarChart3 className="w-4 h-4" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <MousePointer className="w-4 h-4" />, label: 'Events', path: '/events' },
    { icon: <Users className="w-4 h-4" />, label: 'Users', path: '/users' },
    { icon: <Zap className="w-4 h-4" />, label: 'Analytics', path: '/analytics' },
    { icon: <Clock className="w-4 h-4" />, label: 'Real-time', path: '/realtime' },
  ];

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
              <Link to="/dashboard" className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-foreground">Event Analytics</h1>
                  <p className="text-xs text-muted-foreground">v1.0.0</p>
                </div>
              </Link>

              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      location.pathname === item.path
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
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
        {/* Top Bar */}
        <header className="sticky top-0 z-30 glass border-b border-border">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
              </button>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={refreshing}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all",
                    refreshing && "opacity-50"
                  )}
                >
                  <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                  <span className="text-sm font-medium hidden sm:inline">Refresh</span>
                </button>
              )}

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

        <main className="p-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}