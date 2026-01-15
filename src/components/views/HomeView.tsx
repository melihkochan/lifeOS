import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherWidget } from '../widgets/WeatherWidget';
import { BalanceCard } from '../widgets/BalanceCard';
import { QuickStats } from '../widgets/QuickStats';
import { useAppStore, NoteColor } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowRight, Sparkles, Wrench, X, Lock, Clock, TrendingUp, TrendingDown, Calculator, Timer, MapPin, ArrowRightLeft, Key, Shuffle, ChevronRight, Flag, Calendar, CheckCircle2, Link } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

const priorityColors: Record<string, string> = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-success',
};

const noteColorDots: Record<NoteColor, string> = {
  default: 'bg-muted-foreground',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
};

export const HomeView = () => {
  const { tasks, notes, transactions, profile, setActiveTab, language } = useAppStore();
  const { t } = useTranslation();
  const [showTools, setShowTools] = useState(false);

  const dateLocale = language === 'tr' ? tr : enUS;

  const pendingTasks = tasks.filter((task) => !task.completed).slice(0, 3);
  const recentNotes = notes.slice(0, 3);
  const recentTransactions = transactions.slice(0, 5);

  // Get current hour based on local time
  const currentHour = new Date().getHours();
  
  // Determine greeting based on time of day
  // 5:00 - 11:59: Morning (Günaydın)
  // 12:00 - 16:59: Afternoon (İyi günler)
  // 17:00 - 21:59: Evening (İyi akşamlar)
  // 22:00 - 4:59: Night (İyi geceler)
  const getGreeting = () => {
    if (currentHour >= 5 && currentHour < 12) {
      return t.greeting.morning;
    } else if (currentHour >= 12 && currentHour < 17) {
      return t.greeting.afternoon;
    } else if (currentHour >= 17 && currentHour < 22) {
      return t.greeting.evening;
    } else {
      return t.greeting.night;
    }
  };
  
  const greeting = getGreeting();
  
  const userName = profile.name?.split(' ')[0] || '';

  const formatTransactionTime = (date: Date) => {
    const txDate = new Date(date);
    const dateStr = format(txDate, 'd MMM', { locale: dateLocale });
    const time = format(txDate, 'HH:mm', { locale: dateLocale });
    return { dateStr, time };
  };

  const getDueDateLabel = (dueDate: Date | null | undefined) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isToday(date)) return { label: language === 'tr' ? 'Bugün' : 'Today', color: 'text-warning bg-warning/10' };
    if (isTomorrow(date)) return { label: language === 'tr' ? 'Yarın' : 'Tomorrow', color: 'text-primary bg-primary/10' };
    if (isPast(date)) return { label: language === 'tr' ? 'Gecikmiş' : 'Overdue', color: 'text-destructive bg-destructive/10' };
    return { label: format(date, 'd MMM', { locale: dateLocale }), color: 'text-muted-foreground bg-muted' };
  };

  const tools = [
    { id: 'calculator', icon: Calculator, label: t.calculator, color: 'text-primary' },
    { id: 'stopwatch', icon: Timer, label: t.stopwatch, color: 'text-secondary' },
    { id: 'pomodoro', icon: Clock, label: t.pomodoro || 'Pomodoro', color: 'text-warning' },
    { id: 'location', icon: MapPin, label: t.location, color: 'text-secondary' },
    { id: 'converter', icon: ArrowRightLeft, label: t.converter, color: 'text-warning' },
    { id: 'password', icon: Key, label: t.password, color: 'text-destructive' },
    { id: 'random', icon: Shuffle, label: t.random, color: 'text-success' },
    { id: 'qr', icon: Link, label: t.qrGenerator, color: 'text-primary' },
  ];

  const handleToolClick = (toolId: string) => {
    setShowTools(false);
    setActiveTab('tools');
    sessionStorage.setItem('selectedTool', toolId);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold"
        >
          {greeting}{userName ? `, ${userName}` : ''} 👋
        </motion.h1>
        <p className="text-muted-foreground text-sm">{t.whatToDo}</p>
      </div>

      {/* Balance Card */}
      <BalanceCard />

      {/* Weather */}
      <WeatherWidget />

      {/* Quick Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t.summary}</h2>
        <QuickStats onStatClick={(stat) => setActiveTab(stat)} />
      </div>

      {/* Pending Tasks - Modern Design */}
      {pendingTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t.pendingTasks}</h2>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-primary text-sm flex items-center gap-1 hover:underline"
            >
              {t.viewAll} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {pendingTasks.map((task, index) => {
              const dueDateInfo = getDueDateLabel(task.dueDate);
              const priorityColor = priorityColors[task.priority || 'medium'];
              const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
              const totalSubtasks = (task.subtasks || []).length;
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTab('tasks')}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-r from-card to-card/80 border border-border/50 p-3 cursor-pointer hover:border-primary/30 transition-all group"
                >
                  {/* Priority indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityColor}`} />
                  
                  <div className="flex items-center gap-3 pl-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{task.title}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {task.createdAt && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {format(new Date(task.createdAt), 'd MMM, HH:mm', { locale: dateLocale })}
                          </span>
                        )}
                        {dueDateInfo && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${dueDateInfo.color}`}>
                            <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
                            {dueDateInfo.label}
                          </span>
                        )}
                        {totalSubtasks > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {completedSubtasks}/{totalSubtasks}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${priorityColor}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Notes - Modern Grid Design */}
      {recentNotes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t.pendingNotes}</h2>
            <button
              onClick={() => setActiveTab('notes')}
              className="text-primary text-sm flex items-center gap-1 hover:underline"
            >
              {t.viewAll} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {recentNotes.map((note, index) => {
              const colorDot = noteColorDots[note.color || 'default'];
              
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTab('notes')}
                  className="relative rounded-xl bg-gradient-to-br from-card to-muted/30 border border-border/50 p-3 cursor-pointer hover:border-primary/30 transition-all aspect-square flex flex-col"
                >
                  {note.isLocked ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                      <Lock className="w-5 h-5 mb-1" />
                      <span className="text-[10px]">{t.lockedNote}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-2 h-2 rounded-full ${colorDot}`} />
                        {note.createdAt && (
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2 h-2" />
                            {format(new Date(note.createdAt), 'd MMM, HH:mm', { locale: dateLocale })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs line-clamp-3 flex-1 leading-relaxed">{note.content}</p>
                      {note.reminder && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-primary">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{format(new Date(note.reminder), 'd MMM', { locale: dateLocale })}</span>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t.recentTransactions}</h2>
            <button
              onClick={() => setActiveTab('wallet')}
              className="text-primary text-sm flex items-center gap-1 hover:underline"
            >
              {t.viewAll} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {recentTransactions.map((tx, index) => {
              const { dateStr, time } = formatTransactionTime(tx.createdAt);
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="widget flex items-center gap-3"
                >
                  <div className={`p-1.5 rounded-lg ${tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {tx.type === 'income' ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{tx.title}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr} • {time}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                    {tx.type === 'income' ? '+' : '-'}₺{tx.amount.toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tools FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowTools(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <Wrench className="w-6 h-6" />
      </motion.button>

      {/* Tools Modal */}
      <AnimatePresence>
        {showTools && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowTools(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background rounded-t-3xl p-6 pb-8 mb-20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t.tools}</h3>
                <button onClick={() => setShowTools(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {tools.map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <motion.button
                      key={tool.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToolClick(tool.id)}
                      className="flex flex-col items-center gap-2 p-3 bg-muted rounded-xl"
                    >
                      <div className={`p-2 rounded-lg bg-background ${tool.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight">{tool.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
