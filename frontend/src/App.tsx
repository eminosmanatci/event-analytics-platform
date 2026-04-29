import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, BarChart3, Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <nav className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary-600" />
              Event Analytics
            </h1>
          </div>
          
          <div className="px-4 py-2 space-y-1">
            <NavLink to="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
            <NavLink to="/create" icon={<PlusCircle className="w-5 h-5" />} label="Create Event" />
            <NavLink to="/analytics" icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />
          </div>
        </nav>

        {/* Main Content */}
        <main className="ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-primary-600 transition-colors"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default App;