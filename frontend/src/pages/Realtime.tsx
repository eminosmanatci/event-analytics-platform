import { useState, useEffect, useCallback } from 'react';
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

  // Veri çekme işlemini dışarı aldık ki ilk açılışta da hemen çalışsın
  const fetchLiveEvents = useCallback(async () => {
    try {
      const res = await eventApi.getAll({ limit: 10 });
      const fetchedEvents = res.data || [];

      setLiveEvents(prevEvents => {
        // Eğer ekran boşsa direkt gelenleri bas
        if (prevEvents.length === 0) return fetchedEvents;

        // Ekrandaki verilerle yeni gelenleri karşılaştır (Sadece yeni ID'leri bul)
        const newEvents = fetchedEvents.filter(
          (newEvent: LiveEvent) => !prevEvents.some(prev => prev.id === newEvent.id)
        );

        // Yeni event yoksa state'i değiştirme (Gereksiz render'ı engelle)
        if (newEvents.length === 0) return prevEvents;

        // Yenileri en başa ekle, eskilerle birleştir ve ekranda max 12 tane tut
        return [...newEvents, ...prevEvents].slice(0, 12);
      });
      
      setIsConnected(true);
    } catch (e) {
      console.error("Polling error:", e);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    // Sayfa açılır açılmaz ilk veriyi çek (5 saniye bekletme)
    fetchLiveEvents();

    // Ardından her 5 saniyede bir yokla (Short-Polling)
    const interval = setInterval(fetchLiveEvents, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveEvents]);

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
          className="bg-card rounded-xl border border-border p-6 shadow-sm relative overflow-hidden"
        >
          {/* Arka plan parlama efekti */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex items-center justify-between mb-6 relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="w-6 h-6 text-primary" />
                <span className={cn(
                  "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                )} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Live Event Stream</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected • Polling every 5s' : 'Disconnected • Retrying...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className={cn("w-4 h-4", isConnected ? "text-emerald-500" : "text-red-500")} />
              <span className={cn("text-sm font-medium", isConnected ? "text-emerald-600" : "text-red-600")}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="space-y-3 relative">
            <AnimatePresence mode="popLayout">
              {liveEvents.map((event, _index) => (
                <motion.div
                  key={event.id}
                  layout // Elemanların yer değiştirirken kaymasını sağlar
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors shadow-sm"
                >
                  <div className={cn("w-3 h-3 rounded-full shadow-sm", getEventColor(event.event_type))} />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground tracking-wide">
                        {event.event_type.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        #{event.id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      {event.user_id ? `User #${event.user_id}` : 'Guest User'} • {new Date(event.timestamp).toLocaleTimeString('tr-TR')}
                    </p>
                  </div>
                  
                  <Zap className="w-4 h-4 text-muted-foreground/50" />
                </motion.div>
              ))}
            </AnimatePresence>

            {liveEvents.length === 0 && isConnected && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-12 text-muted-foreground"
              >
                <Radio className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse" />
                <p>Listening for incoming events...</p>
              </motion.div>
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