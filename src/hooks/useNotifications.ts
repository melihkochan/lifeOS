import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, subWeeks, subMonths } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export const useNotifications = () => {
  const { notes, markNoteNotified, language } = useAppStore();

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return;
    }

    // Don't request if already granted or denied
    if (Notification.permission !== 'default') {
      return;
    }

    try {
      await Notification.requestPermission();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    // Always show toast
    toast.info(title, { description: body, duration: 10000 });

    // Try browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/lifOSlogo.png',
        badge: '/lifOSlogo.png',
        tag: 'lifeOS-reminder',
      });
    }
  }, []);

  const playAlarm = useCallback(() => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  const checkBudgetAlerts = useCallback(() => {
    const prefs = JSON.parse(localStorage.getItem('lifeOS-notifications') || '{}');
    if (!prefs.financialAlerts) return;

    const { transactions, budgetGoal, savingsGoal, balance } = useAppStore.getState();
    
    // Get current month expenses
    const now = new Date();
    const currentMonthExpenses = transactions
      .filter(t => {
        const txDate = new Date(t.createdAt);
        return t.type === 'expense' && 
               txDate.getMonth() === now.getMonth() && 
               txDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Budget alert - 80% threshold
    if (budgetGoal && currentMonthExpenses >= budgetGoal * 0.8) {
      const title = language === 'tr' ? '💰 Bütçe Uyarısı!' : '💰 Budget Alert!';
      const body = language === 'tr' 
        ? `Aylık bütçenizin %${Math.round((currentMonthExpenses / budgetGoal) * 100)}'ini kullandınız!`
        : `You've used ${Math.round((currentMonthExpenses / budgetGoal) * 100)}% of your monthly budget!`;
      
      const lastBudgetAlert = localStorage.getItem('lifeOS-lastBudgetAlert');
      const today = format(now, 'yyyy-MM-dd');
      if (lastBudgetAlert !== today) {
        sendNotification(title, body);
        localStorage.setItem('lifeOS-lastBudgetAlert', today);
      }
    }

    // Savings goal progress
    if (savingsGoal && balance >= savingsGoal * 0.5) {
      const title = language === 'tr' ? '🎯 Tasarruf İlerlemesi!' : '🎯 Savings Progress!';
      const body = language === 'tr' 
        ? `Tasarruf hedefinizin %${Math.round((balance / savingsGoal) * 100)}'ine ulaştınız!`
        : `You've reached ${Math.round((balance / savingsGoal) * 100)}% of your savings goal!`;
      
      const lastSavingsAlert = localStorage.getItem('lifeOS-lastSavingsAlert');
      const milestone = Math.floor((balance / savingsGoal) * 10);
      if (lastSavingsAlert !== String(milestone) && milestone >= 5) {
        sendNotification(title, body);
        localStorage.setItem('lifeOS-lastSavingsAlert', String(milestone));
      }
    }
  }, [language, sendNotification]);

  const checkWeeklySummary = useCallback(() => {
    const prefs = JSON.parse(localStorage.getItem('lifeOS-notifications') || '{}');
    if (!prefs.financialAlerts) return;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    
    // Send weekly summary on Sundays at 9 AM
    if (dayOfWeek === 0 && hour === 9) {
      const lastWeeklySummary = localStorage.getItem('lifeOS-lastWeeklySummary');
      const thisWeekKey = format(now, 'yyyy-ww');
      
      if (lastWeeklySummary !== thisWeekKey) {
        const { transactions, tasks } = useAppStore.getState();
        const dateLocale = language === 'tr' ? tr : enUS;
        
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        
        const weekTransactions = transactions.filter(t => {
          const txDate = new Date(t.createdAt);
          return isWithinInterval(txDate, { start: weekStart, end: weekEnd });
        });
        
        const weekIncome = weekTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const weekExpense = weekTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const completedTasks = tasks.filter(t => {
          if (!t.completedAt) return false;
          const completedDate = new Date(t.completedAt);
          return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
        }).length;
        
        const title = language === 'tr' ? '📊 Haftalık Özet' : '📊 Weekly Summary';
        const body = language === 'tr'
          ? `Gelir: +₺${weekIncome.toLocaleString()} | Gider: -₺${weekExpense.toLocaleString()} | Tamamlanan görev: ${completedTasks}`
          : `Income: +₺${weekIncome.toLocaleString()} | Expense: -₺${weekExpense.toLocaleString()} | Completed tasks: ${completedTasks}`;
        
        sendNotification(title, body);
        localStorage.setItem('lifeOS-lastWeeklySummary', thisWeekKey);
      }
    }
  }, [language, sendNotification]);

  const checkMonthlySummary = useCallback(() => {
    const prefs = JSON.parse(localStorage.getItem('lifeOS-notifications') || '{}');
    if (!prefs.financialAlerts) return;

    const now = new Date();
    const dayOfMonth = now.getDate();
    const hour = now.getHours();
    
    // Send monthly summary on the 1st at 10 AM
    if (dayOfMonth === 1 && hour === 10) {
      const lastMonthlySummary = localStorage.getItem('lifeOS-lastMonthlySummary');
      const thisMonthKey = format(now, 'yyyy-MM');
      
      if (lastMonthlySummary !== thisMonthKey) {
        const { transactions, tasks, balance } = useAppStore.getState();
        
        // Get last month's data
        const lastMonth = subMonths(now, 1);
        const monthStart = startOfMonth(lastMonth);
        const monthEnd = endOfMonth(lastMonth);
        
        const monthTransactions = transactions.filter(t => {
          const txDate = new Date(t.createdAt);
          return isWithinInterval(txDate, { start: monthStart, end: monthEnd });
        });
        
        const monthIncome = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const monthExpense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const netSavings = monthIncome - monthExpense;
        
        const monthName = language === 'tr' 
          ? format(lastMonth, 'MMMM', { locale: tr })
          : format(lastMonth, 'MMMM', { locale: enUS });
        
        const title = language === 'tr' ? `📈 ${monthName} Aylık Özeti` : `📈 ${monthName} Monthly Summary`;
        const body = language === 'tr'
          ? `Toplam Gelir: ₺${monthIncome.toLocaleString()} | Toplam Gider: ₺${monthExpense.toLocaleString()} | Net: ${netSavings >= 0 ? '+' : ''}₺${netSavings.toLocaleString()}`
          : `Total Income: ₺${monthIncome.toLocaleString()} | Total Expense: ₺${monthExpense.toLocaleString()} | Net: ${netSavings >= 0 ? '+' : ''}₺${netSavings.toLocaleString()}`;
        
        sendNotification(title, body);
        localStorage.setItem('lifeOS-lastMonthlySummary', thisMonthKey);
      }
    }
  }, [language, sendNotification]);

  const checkTaskReminders = useCallback(() => {
    const prefs = JSON.parse(localStorage.getItem('lifeOS-notifications') || '{}');
    if (!prefs.taskReminders) return;

    const { tasks } = useAppStore.getState();
    const now = new Date();

    tasks.forEach((task) => {
      if (!task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        // Alert based on priority and time until due
        let shouldAlert = false;
        let alertKey = '';
        let timeLabel = '';

        // High priority: Alert 24 hours, 1 hour, and when overdue
        if (task.priority === 'high') {
          if (daysDiff <= 1 && daysDiff > 0) {
            alertKey = `lifeOS-taskAlert-${task.id}-24h`;
            timeLabel = language === 'tr' ? '24 saat içinde' : 'within 24 hours';
            shouldAlert = !localStorage.getItem(alertKey);
          } else if (hoursDiff <= 1 && hoursDiff > 0) {
            alertKey = `lifeOS-taskAlert-${task.id}-1h`;
            timeLabel = language === 'tr' ? '1 saat içinde' : 'within 1 hour';
            shouldAlert = !localStorage.getItem(alertKey);
          }
        }
        
        // Medium priority: Alert 4 hours before
        if (task.priority === 'medium' && hoursDiff <= 4 && hoursDiff > 0) {
          alertKey = `lifeOS-taskAlert-${task.id}-4h`;
          timeLabel = language === 'tr' ? '4 saat içinde' : 'within 4 hours';
          shouldAlert = !localStorage.getItem(alertKey);
        }
        
        // Low priority: Alert 1 hour before
        if (task.priority === 'low' && hoursDiff <= 1 && hoursDiff > 0) {
          alertKey = `lifeOS-taskAlert-${task.id}-1h`;
          timeLabel = language === 'tr' ? '1 saat içinde' : 'within 1 hour';
          shouldAlert = !localStorage.getItem(alertKey);
        }

        // Overdue alert for all priorities
        if (timeDiff < 0 && timeDiff > -1000 * 60 * 60) {
          // Recently overdue (within last hour)
          alertKey = `lifeOS-taskAlert-${task.id}-overdue`;
          if (!localStorage.getItem(alertKey)) {
            const title = language === 'tr' ? '⚠️ Görev Gecikti!' : '⚠️ Task Overdue!';
            const body = language === 'tr' 
              ? `"${task.title}" görevi zamanında tamamlanamadı!`
              : `"${task.title}" was not completed on time!`;
            
            playAlarm();
            sendNotification(title, body);
            localStorage.setItem(alertKey, 'true');
          }
        }

        if (shouldAlert && alertKey) {
          const priorityLabel = task.priority === 'high' 
            ? (language === 'tr' ? '🔴 Yüksek Öncelik' : '🔴 High Priority')
            : task.priority === 'medium'
            ? (language === 'tr' ? '🟡 Orta Öncelik' : '🟡 Medium Priority')
            : (language === 'tr' ? '🟢 Düşük Öncelik' : '🟢 Low Priority');
            
          const title = language === 'tr' ? '📋 Görev Hatırlatması!' : '📋 Task Reminder!';
          const body = language === 'tr' 
            ? `${priorityLabel}: "${task.title}" ${timeLabel} tamamlanmalı!`
            : `${priorityLabel}: "${task.title}" must be completed ${timeLabel}!`;
          
          playAlarm();
          sendNotification(title, body);
          localStorage.setItem(alertKey, 'true');
        }
      }
    });
  }, [language, playAlarm, sendNotification]);

  useEffect(() => {
    requestPermission();

    const checkReminders = () => {
      const prefs = JSON.parse(localStorage.getItem('lifeOS-notifications') || '{}');
      
      // Check quiet hours
      if (prefs.quietHoursEnabled) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = prefs.quietHoursStart?.split(':').map(Number) || [22, 0];
        const [endH, endM] = prefs.quietHoursEnd?.split(':').map(Number) || [8, 0];
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        
        if (startMinutes > endMinutes) {
          // Overnight quiet hours
          if (currentTime >= startMinutes || currentTime <= endMinutes) return;
        } else {
          if (currentTime >= startMinutes && currentTime <= endMinutes) return;
        }
      }

      const now = new Date();
      
      // Check note reminders
      if (prefs.noteReminders !== false) {
        notes.forEach((note) => {
          if (note.reminder && !note.reminderNotified) {
            const reminderTime = new Date(note.reminder);
            
            if (reminderTime <= now) {
              const title = language === 'tr' ? '⏰ Hatırlatıcı!' : '⏰ Reminder!';
              const body = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
              
              if (prefs.soundEnabled !== false) playAlarm();
              sendNotification(title, body);
              markNoteNotified(note.id);
            }
          }
        });
      }

      // Check task reminders
      checkTaskReminders();

      // Check budget alerts
      checkBudgetAlerts();
      
      // Check weekly summary
      checkWeeklySummary();
      
      // Check monthly summary
      checkMonthlySummary();
    };

    // Check every 10 seconds
    const interval = setInterval(checkReminders, 10000);
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [notes, markNoteNotified, language, sendNotification, playAlarm, requestPermission, checkTaskReminders, checkBudgetAlerts, checkWeeklySummary, checkMonthlySummary]);

  return { requestPermission };
};
