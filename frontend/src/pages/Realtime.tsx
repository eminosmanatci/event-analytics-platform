import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Activity, Zap } from 'lucide-react';
import Layout from '../components/Layout';
import { eventApi } from '../lib/api';

interface LiveEvent {
  id: number;
  event_type: string;
  timestamp: string;
  user_id: number;
}

export default function Realtime() {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await eventApi.getAll({ limit: 5 });
        setLiveEvents(res.data || []);
      } catch (e) {
        setIsConnected(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      login: 'bg-emerald-500',
      click: 'bg-blue-500',
      purchase: 'bg-amber-500',
      error: 'bg-red-500',
    };
    return colors[type.toLowerCase()] || 'bg-gray-500';
  };

  return (
    <Layout title="Real-time Events">
      <div className="space-y-6 max-w-[1000px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="w-6 h-6 text-primary" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Live Event Stream</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected • Updating every 5s' : 'Disconnected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">Live</span>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {liveEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn("w-3 h-3 rounded-full", getEventColor(event.event_type))} />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{event.event_type}</span>
                      <span className="text-xs text-muted-foreground">#{event.id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      User #{event.user_id} • {new Date(event.timestamp).toLocaleTimeString('tr-TR')}
                    </p>
                  </div>
                  
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              ))}
            </AnimatePresence>

            {liveEvents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Radio className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Waiting for events...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}