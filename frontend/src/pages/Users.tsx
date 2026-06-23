import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Crown, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import { Skeleton } from '../components/Skeleton';
import { eventApi } from '../lib/api';

interface UserStats {
  id: number;
  username: string;
  email: string;
  created_at: string;
  event_count: number;
}

export default function Users() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostActive, setMostActive] = useState<{ username: string; count: number }>({ username: 'None', count: 0 });
  const [newThisMonth, setNewThisMonth] = useState(0);

  useEffect(() => {
    const fetchAndProcessUserData = async () => {
      try {
        setLoading(true);
        // Gerçek veritabanından son event loglarını toplu olarak çekiyoruz
        const res = await eventApi.getAll({ limit: 1000 });
        const events = res.data || [];

        // Ham log verilerini kullanıcı bazında grupluyoruz (Data Aggregation)
        const userMap: Record<number, UserStats> = {};
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        events.forEach((event: any) => {
          const uid = event.user_id;
          if (!uid) return; // Geçersiz veya anonim logları atla

          if (!userMap[uid]) {
            userMap[uid] = {
              id: uid,
              username: `User #${uid}`,
              email: `user_${uid}@analytics.platform`,
              created_at: event.timestamp, // İlk event zamanını geçici olarak atıyoruz
              event_count: 0,
            };
          }

          // Event sayısını artır
          userMap[uid].event_count += 1;

          // Eğer bu event'in tarihi daha eskiyse, kullanıcının sisteme ilk giriş tarihi budur
          if (new Date(event.timestamp) < new Date(userMap[uid].created_at)) {
            userMap[uid].created_at = event.timestamp;
          }
        });

        // Objeyi listeye çevirip en aktif olana göre sıralıyoruz
        const processedUsers = Object.values(userMap).sort((a, b) => b.event_count - a.event_count);
        setUsers(processedUsers);

        // En aktif kullanıcıyı bulma
        if (processedUsers.length > 0) {
          setMostActive({
            username: processedUsers[0].username,
            count: processedUsers[0].event_count,
          });
        }

        // Bu ay katılan yeni kullanıcı sayısını hesaplama
        const currentMonthNewUsers = processedUsers.filter((u) => {
          const joinedDate = new Date(u.created_at);
          return joinedDate.getMonth() === currentMonth && joinedDate.getFullYear() === currentYear;
        }).length;
        
        setNewThisMonth(currentMonthNewUsers);

      } catch (error) {
        console.error('Error processing user metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessUserData();
  }, []);

  return (
    <Layout title="Users">
      <div className="space-y-6 max-w-[1200px] mx-auto">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UsersIcon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Unique Users</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loading ? <Skeleton className="h-9 w-16" /> : users.length}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Most Active</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loading ? <Skeleton className="h-9 w-32" /> : mostActive.username}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? <Skeleton className="h-4 w-20" /> : `${mostActive.count} events`}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">New This Month</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loading ? <Skeleton className="h-9 w-16" /> : `+${newThisMonth}`}
            </p>
          </motion.div>
        </div>

        {/* Users List Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">All Active System Users</h3>
          </div>
          
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No active users found in the tracked events database.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-6 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      U
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{user.event_count} actions tracked</p>
                    <p className="text-xs text-muted-foreground">
                      First Active: {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}