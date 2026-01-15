import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAppStore, Task, Note, Transaction, TaskCategory, TaskPriority, RecurrenceType, NoteColor, NoteCategory } from '@/stores/useAppStore';
import { toast } from 'sonner';

export function useSupabaseData() {
  const { user } = useAuth();

  // Sync functions
  const syncTask = useCallback(async (task: Task) => {
    if (!user) return;

    const taskData = {
      user_id: user.id,
      title: task.title,
      completed: task.completed,
      priority: task.priority,
      category: task.category,
      due_date: task.dueDate?.toISOString() || null,
      recurrence: task.recurrence,
      subtasks: task.subtasks as unknown as null,
    };

    // Check if task exists
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', task.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', task.id);
      if (error) console.error('Task update error:', error);
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert({ id: task.id, ...taskData });
      if (error) console.error('Task insert error:', error);
    }
  }, [user]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) console.error('Task delete error:', error);
  }, [user]);

  const syncNote = useCallback(async (note: Note) => {
    if (!user) return;

    const noteData = {
      user_id: user.id,
      content: note.content,
      color: note.color,
      category: note.category,
      is_locked: note.isLocked || false,
      password_hash: note.password || null,
      reminder: note.reminder?.toISOString() || null,
    };

    const { error } = await supabase
      .from('notes')
      .upsert({ id: note.id, ...noteData });

    if (error) console.error('Note sync error:', error);
  }, [user]);

  const deleteNote = useCallback(async (noteId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) console.error('Note delete error:', error);
  }, [user]);

  const syncTransaction = useCallback(async (transaction: Transaction) => {
    if (!user) return;

    const transactionData = {
      user_id: user.id,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.title,
      category: transaction.category,
    };

    const { error } = await supabase
      .from('transactions')
      .upsert({ id: transaction.id, ...transactionData });

    if (error) console.error('Transaction sync error:', error);
  }, [user]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) console.error('Transaction delete error:', error);
  }, [user]);

  const syncSettings = useCallback(async () => {
    if (!user) return;

    const { balance, language, transactions } = useAppStore.getState();

    // Recalculate balance from transactions to ensure accuracy
    const recalculatedBalance = transactions.reduce((sum, tx) => {
      return sum + (tx.type === 'income' ? tx.amount : -tx.amount);
    }, 0);

    // Get quiet hours from localStorage (will be synced to DB)
    const notificationPrefs = JSON.parse(localStorage.getItem('lifeOS-notifications') || '{}');
    const quietHoursEnabled = notificationPrefs.quietHoursEnabled || false;
    const quietHoursStart = notificationPrefs.quietHoursStart || '22:00';
    const quietHoursEnd = notificationPrefs.quietHoursEnd || '08:00';

    // Get privacy settings from localStorage (will be synced to DB)
    const privacyPrefs = JSON.parse(localStorage.getItem('lifeOS-privacy') || '{}');
    const hideBalances = privacyPrefs.hideBalances || false;
    const hideAmounts = privacyPrefs.hideAmounts || false;
    const biometricLock = privacyPrefs.lockEnabled || false;

    // Get appearance settings from localStorage (will be synced to DB)
    const appearancePrefs = JSON.parse(localStorage.getItem('lifeOS-appearance') || '{}');
    const theme = appearancePrefs.theme || 'dark';
    const accentColor = appearancePrefs.accentColor || 'hsl(186 100% 50%)';
    const fontSize = appearancePrefs.fontSize || 'small';
    const compactMode = appearancePrefs.compactMode !== undefined ? appearancePrefs.compactMode : true;

    // Use recalculated balance instead of stored balance
    const { error } = await supabase
      .from('user_settings')
      .update({ 
        balance: recalculatedBalance, 
        language,
        theme,
        accent_color: accentColor,
        font_size: fontSize,
        compact_mode: compactMode,
        quiet_hours_enabled: quietHoursEnabled,
        quiet_hours_start: quietHoursStart,
        quiet_hours_end: quietHoursEnd,
        hide_balances: hideBalances,
        hide_amounts: hideAmounts,
        biometric_lock: biometricLock,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Settings sync error:', error);
    } else {
      // Update store with recalculated balance to keep it in sync
      useAppStore.setState({ balance: recalculatedBalance });
    }
  }, [user]);

  const syncGoal = useCallback(async (type: 'budget' | 'savings', amount: number) => {
    if (!user) return;

    // Check if goal exists
    const { data: existing } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', type)
      .maybeSingle();

    const goalData = {
      user_id: user.id,
      type,
      amount,
      title: type === 'budget' ? 'Aylık Bütçe' : 'Tasarruf Hedefi',
    };

    if (existing) {
      // Update existing goal
      const { error } = await supabase
        .from('goals')
        .update({ amount, title: goalData.title })
        .eq('id', existing.id);
      if (error) console.error(`${type} goal update error:`, error);
    } else {
      // Insert new goal
      const { error } = await supabase
        .from('goals')
        .insert(goalData);
      if (error) console.error(`${type} goal insert error:`, error);
    }
  }, [user]);

  const syncProfile = useCallback(async () => {
    if (!user) return;

    const { profile } = useAppStore.getState();

    const { error } = await supabase
      .from('profiles')
      .update({ 
        name: profile.name, 
        email: profile.email, 
        phone: profile.phone,
        avatar: profile.avatar || null,
      } as any)
      .eq('user_id', user.id);

    if (error) {
      console.error('Profile sync error:', error);
      throw error;
    }
  }, [user]);

  // Set sync functions in store when user changes (useRef to prevent infinite loop)
  const syncFunctionsRef = useRef({
    syncTask,
    deleteTask,
    syncNote,
    deleteNote,
    syncTransaction,
    deleteTransaction,
    syncSettings,
    syncProfile,
    syncGoal,
  });

  // Update ref when functions change
  useEffect(() => {
    syncFunctionsRef.current = {
      syncTask,
      deleteTask,
      syncNote,
      deleteNote,
      syncTransaction,
      deleteTransaction,
      syncSettings,
      syncProfile,
      syncGoal,
    };
  }, [syncTask, deleteTask, syncNote, deleteNote, syncTransaction, deleteTransaction, syncSettings, syncProfile, syncGoal]);

  // Set sync functions in store only when user changes
  useEffect(() => {
    if (user) {
      useAppStore.getState().setSyncFunctions(syncFunctionsRef.current);
    } else {
      useAppStore.getState().setSyncFunctions(undefined);
    }
  }, [user]);

  // Load data from Supabase when user logs in
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (tasksError) throw tasksError;

      // Load notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Load goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      if (goalsError) throw goalsError;

      // Transform and set data
      const tasks: Task[] = (tasksData || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        createdAt: new Date(t.created_at),
        completedAt: null,
        dueDate: t.due_date ? new Date(t.due_date) : null,
        category: (t.category as TaskCategory) || 'other',
        priority: (t.priority as TaskPriority) || 'medium',
        recurrence: (t.recurrence as RecurrenceType) || 'none',
        lastRecurredAt: null,
        subtasks: Array.isArray(t.subtasks) 
          ? (t.subtasks as unknown as { id: string; title: string; completed: boolean }[])
          : [],
      }));

      const notes: Note[] = (notesData || []).map(n => ({
        id: n.id,
        content: n.content,
        createdAt: new Date(n.created_at),
        reminder: n.reminder ? new Date(n.reminder) : null,
        reminderNotified: false,
        isLocked: n.is_locked || false,
        password: n.password_hash || undefined,
        color: (n.color as NoteColor) || 'default',
        category: (n.category as NoteCategory) || 'personal',
      }));

      const transactions: Transaction[] = (transactionsData || []).map(t => ({
        id: t.id,
        title: t.description || '',
        amount: Number(t.amount),
        type: t.type as 'income' | 'expense',
        category: t.category || 'other',
        createdAt: new Date(t.created_at),
      }));

      // Always calculate balance from transactions (source of truth)
      // This ensures balance is always accurate even if transactions are deleted
      const calculatedBalance = transactions.reduce((sum, tx) => {
        return sum + (tx.type === 'income' ? tx.amount : -tx.amount);
      }, 0);
      
      // If stored balance differs from calculated, log warning
      const storedBalance = settingsData?.balance ? Number(settingsData.balance) : 0;
      if (Math.abs(storedBalance - calculatedBalance) > 0.01) {
        console.warn('Balance mismatch detected. Recalculating from transactions...', {
          stored: storedBalance,
          calculated: calculatedBalance
        });
      }

      // Load quiet hours from database and sync to localStorage
      const settingsDataAny = settingsData as any;
      if (settingsDataAny?.quiet_hours_enabled !== undefined) {
        const quietHoursPrefs = {
          quietHoursEnabled: settingsDataAny.quiet_hours_enabled || false,
          quietHoursStart: settingsDataAny.quiet_hours_start || '22:00',
          quietHoursEnd: settingsDataAny.quiet_hours_end || '08:00',
        };
        
        // Get existing notification prefs and merge with quiet hours
        const existingPrefs = JSON.parse(localStorage.getItem('lifeOS-notifications') || '{}');
        localStorage.setItem('lifeOS-notifications', JSON.stringify({
          ...existingPrefs,
          ...quietHoursPrefs,
        }));
      }

      // Load privacy settings from database and sync to localStorage
      if (settingsDataAny?.hide_balances !== undefined || settingsDataAny?.hide_amounts !== undefined || settingsDataAny?.biometric_lock !== undefined) {
        const privacyPrefs = {
          hideBalances: settingsDataAny.hide_balances || false,
          hideAmounts: settingsDataAny.hide_amounts || false,
          lockEnabled: settingsDataAny.biometric_lock || false,
        };
        
        // Get existing privacy prefs and merge
        const existingPrivacyPrefs = JSON.parse(localStorage.getItem('lifeOS-privacy') || '{}');
        localStorage.setItem('lifeOS-privacy', JSON.stringify({
          ...existingPrivacyPrefs,
          ...privacyPrefs,
        }));
      }

      // Load appearance settings from database and sync to localStorage
      if (settingsDataAny?.theme !== undefined || settingsDataAny?.accent_color !== undefined || settingsDataAny?.font_size !== undefined || settingsDataAny?.compact_mode !== undefined) {
        const appearancePrefs = {
          theme: settingsDataAny.theme || 'dark',
          accentColor: settingsDataAny.accent_color || 'hsl(186 100% 50%)',
          fontSize: settingsDataAny.font_size || 'small',
          compactMode: settingsDataAny.compact_mode !== undefined ? settingsDataAny.compact_mode : true,
        };
        
        // Get existing appearance prefs and merge
        const existingAppearancePrefs = JSON.parse(localStorage.getItem('lifeOS-appearance') || '{}');
        localStorage.setItem('lifeOS-appearance', JSON.stringify({
          ...existingAppearancePrefs,
          ...appearancePrefs,
        }));
      }

      // Update store with database data
      useAppStore.setState({
        tasks,
        notes,
        transactions,
        balance: calculatedBalance,
        language: settingsData?.language === 'en' ? 'en' : 'tr',
        profile: {
          name: profileData?.name || '',
          email: profileData?.email || user?.email || '',
          phone: profileData?.phone || '',
          avatar: profileData?.avatar || undefined,
        },
        budgetGoal: goalsData?.find(g => g.type === 'budget')?.amount ? Number(goalsData.find(g => g.type === 'budget')?.amount) : null,
        savingsGoal: goalsData?.find(g => g.type === 'savings')?.amount ? Number(goalsData.find(g => g.type === 'savings')?.amount) : null,
      });
      
      // Always sync calculated balance to database to keep it in sync
      // This ensures balance is always accurate, even when all transactions are deleted
      if (Math.abs(calculatedBalance - storedBalance) > 0.01) {
        // Use setTimeout to ensure state is updated before syncing
        setTimeout(() => {
          syncSettings().catch(console.error);
        }, 100);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  return {
    loadData,
    syncTask,
    deleteTask,
    syncNote,
    deleteNote,
    syncTransaction,
    deleteTransaction,
    syncSettings,
    syncProfile,
    syncGoal,
  };
}
