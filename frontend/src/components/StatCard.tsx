import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  delay?: number;
}

const colorMap = {
  blue: 'from-blue-500/10 to-blue-600/5 text-blue-600 dark:text-blue-400',
  green: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 dark:text-emerald-400',
  purple: 'from-violet-500/10 to-violet-600/5 text-violet-600 dark:text-violet-400',
  orange: 'from-orange-500/10 to-orange-600/5 text-orange-600 dark:text-orange-400',
  red: 'from-red-500/10 to-red-600/5 text-red-600 dark:text-red-400',
};

const iconBgMap = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  purple: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function StatCard({ title, value, icon, trend, trendLabel, color = 'blue', delay = 0 }: StatCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", colorMap[color])} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl", iconBgMap[color])}>
            {icon}
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              isPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
              isNegative ? "bg-red-500/10 text-red-600 dark:text-red-400" :
              "bg-gray-500/10 text-gray-600 dark:text-gray-400"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> :
               isNegative ? <TrendingDown className="w-3 h-3" /> : null}
              {trend > 0 ? '+' : ''}{trend}%
              {trendLabel && <span className="ml-1 opacity-70">{trendLabel}</span>}
            </div>
          )}
        </div>
        
        <motion.h3
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className="text-3xl font-bold text-foreground"
        >
          {value.toLocaleString()}
        </motion.h3>
        
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </div>
    </motion.div>
  );
}