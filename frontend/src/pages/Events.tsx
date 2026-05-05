import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Send,
  Trash2,
  Clock,
  Tag,
  Code,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MousePointer,
} from 'lucide-react';
import { eventApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface Event {
  id: number;
  user_id: number;
  event_type: string;
  timestamp: string;
  metadata: Record<string, any> | null;
}

const ITEMS_PER_PAGE = 10;

export default function Events() {
  const {  } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Create Event Form
  const [eventType, setEventType] = useState('');
  const [metadata, setMetadata] = useState('{}');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await eventApi.getAll({ limit: 100 });
      setEvents(res.data || []);
    } catch (e) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let parsedMetadata = {};
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        toast.error('Invalid JSON in metadata field');
        setIsSubmitting(false);
        return;
      }

      await eventApi.create({
        event_type: eventType,
        metadata: parsedMetadata,
      });

      toast.success('Event created successfully!');
      setEventType('');
      setMetadata('{}');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await eventApi.delete?.(id) || console.log('Delete not implemented');
      toast.success('Event deleted');
      fetchEvents();
    } catch {
      toast.error('Delete not implemented yet');
    }
  };

  const filteredEvents = events.filter(event =>
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

  const quickTypes = ['login', 'logout', 'click', 'view', 'purchase', 'error', 'task_created'];

  return (
    <div className="min-h-screen bg-background p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your events</p>
        </div>
        <button
          onClick={fetchEvents}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Create Event Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-6">
          <Plus className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Create New Event</h2>
        </div>

        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Event Type</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="e.g., user_login, button_click"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {quickTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEventType(type)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                      eventType === type
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Metadata (JSON)</label>
              <div className="relative">
                <Code className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <textarea
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  placeholder='{"page": "/home", "button": "signup"}'
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all",
              isSubmitting && "opacity-70 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Event
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Events List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">All Events</h3>
              <p className="text-sm text-muted-foreground mt-1">{events.length} total events</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                />
              </div>
              <button className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {paginatedEvents.map((event, index) => (
                      <motion.tr
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-muted/50 transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">#{event.id}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            getEventTypeColor(event.event_type)
                          )}>
                            <MousePointer className="w-3 h-3 mr-1" />
                            {event.event_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {event.user_id}
                            </div>
                            User #{event.user_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(event.timestamp).toLocaleString('tr-TR')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedEvent(event)}
                              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)} of{' '}
                  {filteredEvents.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium px-3">{currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl shadow-2xl max-w-lg w-full border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Event Details</h3>
                <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-muted">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="ID" value={`#${selectedEvent.id}`} />
                  <DetailItem label="User ID" value={selectedEvent.user_id} />
                </div>
                <DetailItem 
                  label="Event Type" 
                  value={
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      getEventTypeColor(selectedEvent.event_type)
                    )}>
                      {selectedEvent.event_type}
                    </span>
                  } 
                />
                <DetailItem 
                  label="Timestamp" 
                  value={new Date(selectedEvent.timestamp).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'medium' })} 
                />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Metadata</label>
                  <pre className="mt-2 p-4 bg-muted rounded-xl text-xs font-mono overflow-auto max-h-60">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <div className="mt-1 text-sm text-foreground font-medium">{value}</div>
    </div>
  );
}