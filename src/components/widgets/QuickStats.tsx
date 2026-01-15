import { motion } from 'framer-motion';
import { CheckCircle2, FileText, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';

interface QuickStatsProps {
  onStatClick?: (stat: 'tasks' | 'notes' | 'wallet') => void;
}

export const QuickStats = ({ onStatClick }: QuickStatsProps) => {
  const { tasks, notes, transactions } = useAppStore();
  const { t } = useTranslation();
  
  const completedTasks = tasks.filter((task) => task.completed).length;
  const thisMonthIncome = transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      const now = new Date();
      return tx.type === 'income' && 
        txDate.getMonth() === now.getMonth() && 
        txDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const stats = [
    {
      id: 'tasks' as const,
      icon: CheckCircle2,
      label: t.nav.tasks,
      value: `${completedTasks}/${tasks.length}`,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      id: 'notes' as const,
      icon: FileText,
      label: t.nav.notes,
      value: notes.length.toString(),
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      id: 'wallet' as const,
      icon: TrendingUp,
      label: t.thisMonth,
      value: `₺${thisMonthIncome.toLocaleString()}`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1 + 0.2,
              duration: 0.4,
              ease: "easeOut"
            }}
            whileHover={{ 
              scale: 1.05, 
              y: -4,
              transition: { duration: 0.2 }
            }}
            onClick={() => onStatClick?.(stat.id)}
            className="widget-animated flex flex-col items-center text-center py-3 cursor-pointer"
          >
            <motion.div 
              className={`p-2 rounded-xl ${stat.bgColor} mb-2`}
              whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
            >
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </motion.div>
            <span className="text-base font-bold">{stat.value}</span>
            <span className="text-[10px] text-muted-foreground">{stat.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
};
