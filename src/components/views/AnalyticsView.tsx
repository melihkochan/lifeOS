import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, PiggyBank, Edit2, Check, X, Download, Utensils, ShoppingBag, Car, Film, MoreHorizontal, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, eachWeekOfInterval, subWeeks, isSameWeek, isSameDay, subDays, startOfDay, endOfDay } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

const COLORS = ['#00d4ff', '#a855f7', '#ec4899', '#22c55e', '#f59e0b', '#6366f1'];

const categoryIcons: Record<string, any> = {
  food: Utensils,
  shopping: ShoppingBag,
  transport: Car,
  entertainment: Film,
  other: MoreHorizontal,
};

export const AnalyticsView = () => {
  const { transactions, tasks, language, savingsGoal, setSavingsGoal } = useAppStore();
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('monthly');
  const [isEditingSavings, setIsEditingSavings] = useState(false);
  const [newSavingsGoal, setNewSavingsGoal] = useState(savingsGoal?.toString() || '');
  const [taskViewMode, setTaskViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [isSavingsFocused, setIsSavingsFocused] = useState(false);
  
  const dateLocale = language === 'tr' ? tr : enUS;

  // Format number with thousands separator (real-time while typing)
  const formatNumber = (value: string): string => {
    if (!value) return '';
    // Remove all formatting to get raw number
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '';
    
    // Format with Turkish locale (dot as thousands separator)
    return num.toLocaleString('tr-TR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2,
      useGrouping: true
    });
  };

  // Parse formatted number back to numeric value
  const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // Handle savings goal input change with real-time formatting
  const handleSavingsGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const inputValue = input.value;
    const cursorPosition = input.selectionStart || 0;
    
    // Remove all formatting to get raw number
    const rawValue = inputValue.replace(/\./g, '').replace(',', '.');
    
    // Only allow digits and one decimal point/comma
    let cleaned = '';
    let hasDecimal = false;
    for (let i = 0; i < rawValue.length; i++) {
      const char = rawValue[i];
      if (/\d/.test(char)) {
        cleaned += char;
      } else if ((char === ',' || char === '.') && !hasDecimal) {
        cleaned += ',';
        hasDecimal = true;
      }
    }
    
    // Limit decimal places to 2
    if (hasDecimal) {
      const parts = cleaned.split(',');
      if (parts[1] && parts[1].length > 2) {
        cleaned = parts[0] + ',' + parts[1].substring(0, 2);
      }
    }
    
    // Format the number
    const formatted = formatNumber(cleaned);
    
    // Calculate new cursor position
    const digitsBeforeCursor = inputValue.substring(0, cursorPosition).replace(/\D/g, '').length;
    
    let newCursorPos = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      newCursorPos = i + 1;
    }
    
    setNewSavingsGoal(formatted);
    
    // Restore cursor position
    requestAnimationFrame(() => {
      input.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  // Format on blur
  const handleSavingsGoalBlur = () => {
    setIsSavingsFocused(false);
    if (newSavingsGoal) {
      const formatted = formatNumber(newSavingsGoal);
      setNewSavingsGoal(formatted);
    }
  };

  // Filter transactions by selected period (daily or monthly)
  const filteredTransactions = useMemo(() => {
    if (viewMode === 'daily') {
      return transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return format(txDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      });
    } else {
      return transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return isSameMonth(txDate, selectedMonth);
      });
    }
  }, [transactions, selectedMonth, selectedDate, viewMode]);

  // Always calculate monthly transactions for savings goal (independent of view mode)
  const actualMonthlyTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return isSameMonth(txDate, selectedMonth);
    });
  }, [transactions, selectedMonth]);

  // For backward compatibility
  const monthlyTransactions = filteredTransactions;

  // Previous period transactions for comparison
  const previousPeriodTransactions = useMemo(() => {
    if (viewMode === 'daily') {
      const previousDay = subDays(selectedDate, 1);
      return transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return isSameDay(txDate, previousDay);
      });
    } else {
      const lastMonth = subMonths(selectedMonth, 1);
      return transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return isSameMonth(txDate, lastMonth);
      });
    }
  }, [transactions, selectedMonth, selectedDate, viewMode]);

  // For backward compatibility
  const lastMonthTransactions = previousPeriodTransactions;

  // Calculate period stats (daily or monthly)
  const periodStats = useMemo(() => {
    const income = filteredTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = filteredTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  // For backward compatibility
  const monthlyStats = periodStats;

  // Previous period stats for comparison
  const previousPeriodStats = useMemo(() => {
    const income = previousPeriodTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = previousPeriodTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense, net: income - expense };
  }, [previousPeriodTransactions]);

  // For backward compatibility
  const lastMonthStats = previousPeriodStats;

  // Calculate percentage change
  const getPercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = getPercentChange(periodStats.income, previousPeriodStats.income);
  const expenseChange = getPercentChange(periodStats.expense, previousPeriodStats.expense);

  // Savings calculation - always use actual monthly net for savings goal
  // Savings goal is a monthly target, so we always calculate based on actual monthly transactions
  const actualMonthlyStats = useMemo(() => {
    const income = actualMonthlyTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = actualMonthlyTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense, net: income - expense };
  }, [actualMonthlyTransactions]);

  const currentSavings = actualMonthlyStats.net;
  const savingsProgress = savingsGoal && savingsGoal > 0 ? Math.min((currentSavings / savingsGoal) * 100, 100) : 0;

  // Category breakdown for pie chart with percentages
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    const totalExpense = filteredTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    filteredTransactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
      });
    
    return Object.entries(categories).map(([name, value]) => ({
      name: t.categories[name as keyof typeof t.categories] || name,
      key: name,
      value,
      percentage: totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : '0',
    }));
  }, [filteredTransactions, t]);

  // Daily spending for line chart (only for monthly view)
  const dailyData = useMemo(() => {
    if (viewMode === 'daily') {
      // For daily view, show hourly breakdown
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const incomeLabel = language === 'tr' ? 'gelir' : 'income';
      const expenseLabel = language === 'tr' ? 'gider' : 'expense';
      
      return hours.map((hour) => {
        const hourTransactions = filteredTransactions.filter((tx) => {
          const txDate = new Date(tx.createdAt);
          return txDate.getHours() === hour;
        });
        const income = hourTransactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
        const expense = hourTransactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
        return {
          hour: `${hour}:00`,
          [incomeLabel]: income,
          [expenseLabel]: expense,
        };
      });
    } else {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      const days = eachDayOfInterval({ start, end });

      const incomeLabel = language === 'tr' ? 'gelir' : 'income';
      const expenseLabel = language === 'tr' ? 'gider' : 'expense';

      return days.map((day) => {
        const dayTransactions = monthlyTransactions.filter(
          (tx) => format(new Date(tx.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        );
        const income = dayTransactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
        const expense = dayTransactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
        return {
          day: format(day, 'd'),
          [incomeLabel]: income,
          [expenseLabel]: expense,
        };
      });
    }
  }, [monthlyTransactions, filteredTransactions, selectedMonth, viewMode, language]);

  // Last 6 months/days for bar chart (depending on view mode)
  const last6MonthsData = useMemo(() => {
    if (viewMode === 'daily') {
      // Show last 6 days for daily view
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const day = subDays(selectedDate, i);
        const dayTx = transactions.filter((tx) => {
          const txDate = new Date(tx.createdAt);
          return format(txDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        });
        const income = dayTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
        const expense = dayTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
        data.push({
          month: format(day, 'd MMM', { locale: dateLocale }),
          income,
          expense,
        });
      }
      return data;
    } else {
      // Show last 6 months for monthly view
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const monthTx = transactions.filter((tx) => isSameMonth(new Date(tx.createdAt), month));
        const income = monthTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
        const expense = monthTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
        data.push({
          month: t.months[month.getMonth()],
          income,
          expense,
        });
      }
      return data;
    }
  }, [transactions, t.months, viewMode, selectedDate, dateLocale]);

  // Task stats - filtered by view mode
  const taskStats = useMemo(() => {
    let filteredTasks = tasks;
    
    // Filter tasks based on view mode
    if (viewMode === 'daily') {
      filteredTasks = tasks.filter((task) => {
        const taskDate = new Date(task.createdAt);
        return format(taskDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      });
    } else {
      filteredTasks = tasks.filter((task) => {
        const taskDate = new Date(task.createdAt);
        return isSameMonth(taskDate, selectedMonth);
      });
    }
    
    const completed = filteredTasks.filter((task) => task.completed).length;
    const pending = filteredTasks.filter((task) => !task.completed).length;
    return { completed, pending, total: filteredTasks.length };
  }, [tasks, viewMode, selectedDate, selectedMonth]);

  // Weekly task statistics
  const weeklyTaskData = useMemo(() => {
    // If daily view, show only the selected day's data
    if (viewMode === 'daily') {
      const dayTasks = tasks.filter(task => {
        const createdAt = new Date(task.createdAt);
        return format(createdAt, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      });
      const completed = dayTasks.filter(t => t.completed).length;
      const total = dayTasks.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return [{
        week: format(selectedDate, 'd MMM', { locale: dateLocale }),
        completed,
        pending: total - completed,
        rate,
        total,
      }];
    }
    
    // Monthly view: show weekly data
    const data = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1, locale: dateLocale });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1, locale: dateLocale });
      
      const weekTasks = tasks.filter(task => {
        const createdAt = new Date(task.createdAt);
        return createdAt >= weekStart && createdAt <= weekEnd;
      });
      
      const completed = weekTasks.filter(t => t.completed).length;
      const total = weekTasks.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      data.push({
        week: format(weekStart, 'd MMM', { locale: dateLocale }),
        completed,
        pending: total - completed,
        rate,
        total,
      });
    }
    return data;
  }, [tasks, dateLocale, viewMode, selectedDate]);

  // Monthly task statistics
  const monthlyTaskData = useMemo(() => {
    // If daily view, show only the selected day's data
    if (viewMode === 'daily') {
      const dayTasks = tasks.filter(task => {
        const createdAt = new Date(task.createdAt);
        return format(createdAt, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      });
      const completed = dayTasks.filter(t => t.completed).length;
      const total = dayTasks.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return [{
        month: format(selectedDate, 'd MMM', { locale: dateLocale }),
        completed,
        pending: total - completed,
        rate,
        total,
      }];
    }
    
    // Monthly view: show monthly data
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthTasks = tasks.filter(task => {
        const createdAt = new Date(task.createdAt);
        return isSameMonth(createdAt, month);
      });
      
      const completed = monthTasks.filter(t => t.completed).length;
      const total = monthTasks.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      data.push({
        month: t.months[month.getMonth()],
        completed,
        pending: total - completed,
        rate,
        total,
      });
    }
    return data;
  }, [tasks, t.months, viewMode, selectedDate, dateLocale]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'daily') {
      setSelectedDate((prev) =>
        direction === 'prev' ? subDays(prev, 1) : subDays(prev, -1)
      );
    } else {
      setSelectedMonth((prev) =>
        direction === 'prev' ? subMonths(prev, 1) : subMonths(prev, -1)
      );
    }
  };

  const handleSaveSavingsGoal = () => {
    const goal = parseFormattedNumber(newSavingsGoal);
    if (isNaN(goal) || goal <= 0) {
      toast.error(t.invalidAmount || 'Geçersiz tutar');
      return;
    }
    setSavingsGoal(goal);
    setIsEditingSavings(false);
    toast.success(language === 'tr' ? 'Tasarruf hedefi belirlendi' : 'Savings goal set');
  };

  const generatePDFReport = () => {
    const periodName = viewMode === 'daily' 
      ? format(selectedDate, 'd MMMM yyyy', { locale: dateLocale })
      : format(selectedMonth, 'MMMM yyyy', { locale: dateLocale });
    const reportType = viewMode === 'daily' ? 'günlük' : 'aylık';
    
    const reportTitle = viewMode === 'daily' 
      ? (language === 'tr' ? 'GÜNLÜK FİNANSAL RAPOR' : 'DAILY FINANCIAL REPORT')
      : (language === 'tr' ? 'AYLIK FİNANSAL RAPOR' : 'MONTHLY FINANCIAL REPORT');
    const comparisonTitle = viewMode === 'daily'
      ? (language === 'tr' ? 'GEÇEN GÜN KARŞILAŞTIRMA' : 'PREVIOUS DAY COMPARISON')
      : (language === 'tr' ? 'GEÇEN AY KARŞILAŞTIRMA' : 'LAST MONTH COMPARISON');
    
    const reportContent = `
╔══════════════════════════════════════════════════════════════╗
║                    ${reportTitle.padEnd(53)}║
║                    ${periodName.toUpperCase().padStart(20).padEnd(35)}║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ÖZET                                                         ║
║  ─────────────────────────────────────────────────────────    ║
║  Toplam Gelir:     ₺${periodStats.income.toLocaleString().padStart(15)}                    ║
║  Toplam Gider:     ₺${periodStats.expense.toLocaleString().padStart(15)}                    ║
║  Net Bakiye:       ₺${periodStats.net.toLocaleString().padStart(15)}                    ║
║                                                               ║
║  ${comparisonTitle.padEnd(53)}║
║  ─────────────────────────────────────────────────────────    ║
║  Gelir Değişimi:   ${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%                                    ║
║  Gider Değişimi:   ${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%                                    ║
║                                                               ║
║  KATEGORİ BAZLI HARCAMALAR                                    ║
║  ─────────────────────────────────────────────────────────    ║
${categoryData.map(cat => `║  ${cat.name.padEnd(18)} ₺${cat.value.toLocaleString().padStart(10)} (${cat.percentage}%)`.padEnd(63) + '║').join('\n')}
║                                                               ║
║  GÖREV İSTATİSTİKLERİ                                         ║
║  ─────────────────────────────────────────────────────────    ║
║  Tamamlanan:       ${taskStats.completed.toString().padStart(10)}                              ║
║  Bekleyen:         ${taskStats.pending.toString().padStart(10)}                              ║
║  Toplam:           ${taskStats.total.toString().padStart(10)}                              ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝

Oluşturulma Tarihi: ${format(new Date(), 'd MMMM yyyy HH:mm', { locale: dateLocale })}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = viewMode === 'daily'
      ? `finansal-rapor-gunluk-${format(selectedDate, 'yyyy-MM-dd')}.txt`
      : `finansal-rapor-aylik-${format(selectedMonth, 'yyyy-MM')}.txt`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(language === 'tr' ? 'Rapor indirildi!' : 'Report downloaded!');
  };

  const taskChartData = taskViewMode === 'weekly' ? weeklyTaskData : monthlyTaskData;
  const taskChartKey = taskViewMode === 'weekly' ? 'week' : 'month';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5 pb-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t.analytics}</h1>
          <p className="text-muted-foreground text-sm">{t.financialOverview}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={generatePDFReport}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          PDF
        </motion.button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setViewMode('daily')}
          className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
            viewMode === 'daily'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {t.daily}
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
            viewMode === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {t.monthly}
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigatePeriod('prev')}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-semibold">
            {viewMode === 'daily'
              ? format(selectedDate, 'd MMMM yyyy', { locale: dateLocale })
              : format(selectedMonth, 'MMMM yyyy', { locale: dateLocale })}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigatePeriod('next')}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Monthly Summary Cards with Comparison */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="widget"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
              incomeChange >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
            }`}>
              {incomeChange >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {Math.abs(incomeChange).toFixed(0)}%
            </div>
          </div>
          <p className="text-lg font-bold text-success">₺{monthlyStats.income.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{t.totalIncome}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {language === 'tr' ? 'Geçen ay' : 'Last month'}: ₺{lastMonthStats.income.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="widget"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
              expenseChange <= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
            }`}>
              {expenseChange >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {Math.abs(expenseChange).toFixed(0)}%
            </div>
          </div>
          <p className="text-lg font-bold text-destructive">₺{monthlyStats.expense.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{t.totalExpense}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {language === 'tr' ? 'Geçen ay' : 'Last month'}: ₺{lastMonthStats.expense.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="widget"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <p className={`text-lg font-bold ${monthlyStats.net >= 0 ? 'text-success' : 'text-destructive'}`}>
            {monthlyStats.net >= 0 ? '+' : ''}₺{Math.abs(monthlyStats.net).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">{t.netBalance}</p>
        </motion.div>
      </div>

      {/* Savings Goal Card - Only show in monthly view */}
      {viewMode === 'monthly' && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="widget"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-primary" />
            <span className="font-semibold">{language === 'tr' ? 'Tasarruf Hedefi' : 'Savings Goal'}</span>
          </div>
          {!isEditingSavings ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setNewSavingsGoal(savingsGoal ? savingsGoal.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '');
                setIsEditingSavings(true);
              }}
              className="p-1.5 rounded-lg bg-muted"
            >
              <Edit2 className="w-3 h-3" />
            </motion.button>
          ) : (
            <div className="flex gap-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSaveSavingsGoal}
                className="p-1.5 rounded-lg bg-success/20 text-success"
              >
                <Check className="w-3 h-3" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditingSavings(false)}
                className="p-1.5 rounded-lg bg-destructive/20 text-destructive"
              >
                <X className="w-3 h-3" />
              </motion.button>
            </div>
          )}
        </div>

        {isEditingSavings ? (
          <div className="flex items-center gap-2">
            <span className="font-bold">₺</span>
            <input
              type="text"
              value={newSavingsGoal}
              onChange={handleSavingsGoalChange}
              onFocus={() => setIsSavingsFocused(true)}
              onBlur={handleSavingsGoalBlur}
              className="input-glass flex-1 text-lg font-bold"
              placeholder="0"
              autoFocus
              inputMode="decimal"
            />
          </div>
        ) : savingsGoal ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                {language === 'tr' ? 'Bu ay tasarruf' : 'This month savings'}
              </span>
              <span className={`text-lg font-bold ${currentSavings >= 0 ? 'text-success' : 'text-destructive'}`}>
                {currentSavings >= 0 ? '+' : ''}₺{currentSavings.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{language === 'tr' ? 'Hedef' : 'Goal'}: ₺{savingsGoal.toLocaleString()}</span>
              <span>{savingsProgress.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, savingsProgress)}%` }}
                className={`h-full rounded-full ${
                  currentSavings >= savingsGoal ? 'bg-success' : currentSavings >= 0 ? 'bg-primary' : 'bg-destructive'
                }`}
              />
            </div>
            {currentSavings >= savingsGoal && (
              <p className="text-xs text-success mt-2 text-center">
                🎉 {language === 'tr' ? 'Hedefe ulaştınız!' : 'Goal reached!'}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {language === 'tr' ? 'Aylık tasarruf hedefi belirleyin' : 'Set a monthly savings goal'}
          </p>
        )}
      </motion.div>
      )}

      {/* Task Statistics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="widget"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            <span className="font-semibold">{language === 'tr' ? 'Görev İstatistikleri' : 'Task Statistics'}</span>
          </div>
          {/* Only show weekly/monthly toggle in monthly view */}
          {viewMode === 'monthly' && (
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setTaskViewMode('weekly')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  taskViewMode === 'weekly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {language === 'tr' ? 'Haftalık' : 'Weekly'}
              </button>
              <button
                onClick={() => setTaskViewMode('monthly')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  taskViewMode === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {language === 'tr' ? 'Aylık' : 'Monthly'}
              </button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-success/10 rounded-xl p-3 text-center">
            <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-lg font-bold text-success">{taskStats.completed}</p>
            <p className="text-[10px] text-muted-foreground">{language === 'tr' ? 'Tamamlanan' : 'Completed'}</p>
          </div>
          <div className="bg-warning/10 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold text-warning">{taskStats.pending}</p>
            <p className="text-[10px] text-muted-foreground">{language === 'tr' ? 'Bekleyen' : 'Pending'}</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center">
            <Target className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-primary">
              {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
            </p>
            <p className="text-[10px] text-muted-foreground">{language === 'tr' ? 'Oran' : 'Rate'}</p>
          </div>
        </div>

        {/* Task Completion Chart */}
        {taskChartData.some(d => d.total > 0) ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskChartData} barGap={2}>
                <XAxis dataKey={taskChartKey} stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="completed" stackId="tasks" fill="#22c55e" radius={[0, 0, 0, 0]} name={language === 'tr' ? 'Tamamlanan' : 'Completed'} />
                <Bar dataKey="pending" stackId="tasks" fill="#f59e0b" radius={[4, 4, 0, 0]} name={language === 'tr' ? 'Bekleyen' : 'Pending'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">{t.noDataYet}</p>
        )}

        {/* Completion Rate Line */}
        {taskChartData.some(d => d.total > 0) && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">{language === 'tr' ? 'Tamamlama Oranı' : 'Completion Rate'}</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taskChartData}>
                  <XAxis dataKey={taskChartKey} stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={30} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, language === 'tr' ? 'Oran' : 'Rate']}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-muted-foreground">{language === 'tr' ? 'Tamamlanan' : 'Completed'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-warning" />
            <span className="text-muted-foreground">{language === 'tr' ? 'Bekleyen' : 'Pending'}</span>
          </div>
        </div>
      </motion.div>

      {/* Daily/Hourly Spending Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="widget"
      >
        <h3 className="font-semibold mb-3">{viewMode === 'daily' ? (language === 'tr' ? 'Saatlik Dağılım' : 'Hourly Breakdown') : t.timeline}</h3>
        {dailyData.some((d) => Object.values(d).some(v => typeof v === 'number' && v > 0)) ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'daily' ? (
                <BarChart data={dailyData}>
                  <XAxis dataKey="hour" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey={language === 'tr' ? 'gelir' : 'income'} fill="#22c55e" name={language === 'tr' ? 'Gelir' : 'Income'} />
                  <Bar dataKey={language === 'tr' ? 'gider' : 'expense'} fill="#ef4444" name={language === 'tr' ? 'Gider' : 'Expense'} />
                </BarChart>
              ) : (
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey={language === 'tr' ? 'gelir' : 'income'} stroke="#22c55e" fill="url(#incomeGradient)" strokeWidth={2} name={language === 'tr' ? 'Gelir' : 'Income'} />
                  <Area type="monotone" dataKey={language === 'tr' ? 'gider' : 'expense'} stroke="#ef4444" fill="url(#expenseGradient)" strokeWidth={2} name={language === 'tr' ? 'Gider' : 'Expense'} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">{t.noDataYet}</p>
        )}
      </motion.div>

      {/* Category Breakdown with Percentages */}
      {categoryData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="widget"
        >
          <h3 className="font-semibold mb-3">{t.expensesByCategory}</h3>
          <div className="flex flex-col gap-4">
            <div className="w-full h-32 flex justify-center">
              <ResponsiveContainer width={140} height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {categoryData.map((cat, index) => {
                const Icon = categoryIcons[cat.key] || MoreHorizontal;
                return (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-medium flex-shrink-0">{cat.percentage}%</span>
                    <span className="text-xs font-bold flex-shrink-0">₺{cat.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* 6 Month Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="widget"
      >
        <h3 className="font-semibold mb-3">
          {viewMode === 'daily' 
            ? (language === 'tr' ? 'Son 6 Gün' : 'Last 6 Days')
            : t.incomeVsExpense}
        </h3>
        {last6MonthsData.some((d) => d.income > 0 || d.expense > 0) ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6MonthsData} barGap={2}>
                <XAxis dataKey="month" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name={t.income} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name={t.expense} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">{t.noDataYet}</p>
        )}
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-muted-foreground">{t.income}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <span className="text-muted-foreground">{t.expense}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
