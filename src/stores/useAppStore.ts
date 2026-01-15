import { create } from 'zustand';

export type TaskCategory = 'work' | 'personal' | 'shopping' | 'health' | 'other';
export type TaskPriority = 'high' | 'medium' | 'low';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date | null;
  dueDate?: Date | null;
  category: TaskCategory;
  priority: TaskPriority;
  recurrence: RecurrenceType;
  lastRecurredAt?: Date | null;
  subtasks: SubTask[];
}

export type NoteColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
export type NoteCategory = 'personal' | 'work' | 'ideas' | 'todo' | 'important' | 'other';

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  reminder?: Date | null;
  reminderNotified?: boolean;
  isLocked?: boolean;
  password?: string;
  color: NoteColor;
  category: NoteCategory;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  createdAt: Date;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export type Language = 'tr' | 'en';

interface AppState {
  tasks: Task[];
  notes: Note[];
  transactions: Transaction[];
  balance: number;
  budgetGoal: number | null;
  savingsGoal: number | null;
  activeTab: string;
  language: Language;
  profile: Profile;
  
  // Tasks
  addTask: (title: string, dueDate?: Date | null, category?: TaskCategory, priority?: TaskPriority, recurrence?: RecurrenceType) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTaskCategory: (id: string, category: TaskCategory) => void;
  updateTaskPriority: (id: string, priority: TaskPriority) => void;
  updateTaskRecurrence: (id: string, recurrence: RecurrenceType) => void;
  updateTaskDueDate: (id: string, dueDate: Date | null) => void;
  reorderTasks: (taskIds: string[]) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  
  // Data management
  importData: (data: string) => boolean;
  
  // Notes
  addNote: (content: string, reminder?: Date | null, color?: NoteColor, category?: NoteCategory) => void;
  updateNoteReminder: (id: string, reminder: Date | null) => void;
  updateNoteColor: (id: string, color: NoteColor) => void;
  updateNoteCategory: (id: string, category: NoteCategory) => void;
  markNoteNotified: (id: string) => void;
  deleteNote: (id: string) => void;
  toggleNoteLock: (id: string, password?: string) => void;
  
  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;
  updateBalance: (amount: number) => void;
  setBudgetGoal: (goal: number) => void;
  setSavingsGoal: (goal: number) => void;
  
  // General
  setActiveTab: (tab: string) => void;
  setLanguage: (lang: Language) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  
  // Internal sync functions (set by useSupabaseData hook)
  _setSyncFunctions?: {
    syncTask: (task: Task) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    syncNote: (note: Note) => Promise<void>;
    deleteNote: (noteId: string) => Promise<void>;
    syncTransaction: (transaction: Transaction) => Promise<void>;
    deleteTransaction: (transactionId: string) => Promise<void>;
    syncSettings: () => Promise<void>;
    syncProfile: () => Promise<void>;
    syncGoal: (type: 'budget' | 'savings', amount: number) => Promise<void>;
  };
  setSyncFunctions: (syncFunctions: AppState['_setSyncFunctions']) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
      tasks: [],
      notes: [],
      transactions: [],
      balance: 0,
      budgetGoal: null,
      savingsGoal: null,
      activeTab: 'home',
      language: 'tr',
      profile: { name: '', email: '', phone: '' },
      _setSyncFunctions: undefined,
      
      setSyncFunctions: (syncFunctions) => set({ _setSyncFunctions: syncFunctions }),

      // Tasks
      addTask: (title, dueDate = null, category = 'other', priority = 'medium', recurrence = 'none') => {
        const newTask: Task = { 
          id: crypto.randomUUID(), 
          title, 
          completed: false, 
          createdAt: new Date(), 
          dueDate, 
          completedAt: null, 
          category, 
          priority, 
          recurrence, 
          lastRecurredAt: null, 
          subtasks: [] 
        };
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
        // Sync to Supabase
        get()._setSyncFunctions?.syncTask(newTask).catch(console.error);
      },

      updateTaskDueDate: (id, dueDate) => {
        let updatedTask: Task | undefined;
        set((state) => {
          const task = state.tasks.find(t => t.id === id);
          updatedTask = task ? { ...task, dueDate } : undefined;
          return {
            tasks: state.tasks.map((task) =>
              task.id === id ? { ...task, dueDate } : task
            ),
          };
        });
        // Sync to Supabase
        if (updatedTask) {
          get()._setSyncFunctions?.syncTask(updatedTask).catch(console.error);
        }
      },

      reorderTasks: (taskIds) => {
        set((state) => {
          const taskMap = new Map(state.tasks.map(t => [t.id, t]));
          const reorderedTasks = taskIds.map(id => taskMap.get(id)).filter(Boolean) as Task[];
          const remainingTasks = state.tasks.filter(t => !taskIds.includes(t.id));
          return { tasks: [...reorderedTasks, ...remainingTasks] };
        });
        // Sync all reordered tasks to Supabase
        const syncFunctions = get()._setSyncFunctions;
        if (syncFunctions) {
          taskIds.forEach(taskId => {
            const task = get().tasks.find(t => t.id === taskId);
            if (task) {
              syncFunctions.syncTask(task).catch(console.error);
            }
          });
        }
      },

      addSubtask: (taskId, title) => {
        let updatedTask: Task | undefined;
        set((state) => {
          const task = state.tasks.find(t => t.id === taskId);
          if (task) {
            updatedTask = { ...task, subtasks: [...(task.subtasks || []), { id: crypto.randomUUID(), title, completed: false }] };
          }
          return {
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? { ...task, subtasks: [...(task.subtasks || []), { id: crypto.randomUUID(), title, completed: false }] }
                : task
            ),
          };
        });
        // Sync to Supabase
        if (updatedTask) {
          get()._setSyncFunctions?.syncTask(updatedTask).catch(console.error);
        }
      },

      toggleSubtask: (taskId, subtaskId) => {
        let updatedTask: Task | undefined;
        set((state) => {
          const task = state.tasks.find(t => t.id === taskId);
          if (task) {
            updatedTask = {
              ...task,
              subtasks: (task.subtasks || []).map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            };
          }
          return {
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    subtasks: (task.subtasks || []).map((st) =>
                      st.id === subtaskId ? { ...st, completed: !st.completed } : st
                    ),
                  }
                : task
            ),
          };
        });
        // Sync to Supabase
        if (updatedTask) {
          get()._setSyncFunctions?.syncTask(updatedTask).catch(console.error);
        }
      },

      deleteSubtask: (taskId, subtaskId) => {
        let updatedTask: Task | undefined;
        set((state) => {
          const task = state.tasks.find(t => t.id === taskId);
          if (task) {
            updatedTask = { ...task, subtasks: (task.subtasks || []).filter((st) => st.id !== subtaskId) };
          }
          return {
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? { ...task, subtasks: (task.subtasks || []).filter((st) => st.id !== subtaskId) }
                : task
            ),
          };
        });
        // Sync to Supabase
        if (updatedTask) {
          get()._setSyncFunctions?.syncTask(updatedTask).catch(console.error);
        }
      },

      updateTaskCategory: (id, category) => {
        let updatedTask: Task | undefined;
        set((state) => {
          const task = state.tasks.find(t => t.id === id);
          updatedTask = task ? { ...task, category } : undefined;
          return {
            tasks: state.tasks.map((task) =>
              task.id === id ? { ...task, category } : task
            ),
          };
        });
        // Sync to Supabase
        if (updatedTask) {
          get()._setSyncFunctions?.syncTask(updatedTask).catch(console.error);
        }
      },

      updateTaskPriority: (id, priority) => {
        let updatedTask: Task | undefined;
        set((state) => {
          const task = state.tasks.find(t => t.id === id);
          updatedTask = task ? { ...task, priority } : undefined;
          return {
            tasks: state.tasks.map((task) =>
              task.id === id ? { ...task, priority } : task
            ),
          };
        });
        // Sync to Supabase
        if (updatedTask) {
          get()._setSyncFunctions?.syncTask(updatedTask).catch(console.error);
        }
      },

      updateTaskRecurrence: (id, recurrence) => {
        let updatedTask: Task | undefined;
        set((state) => {
          const task = state.tasks.find(t => t.id === id);
          updatedTask = task ? { ...task, recurrence } : undefined;
          return {
            tasks: state.tasks.map((task) =>
              task.id === id ? { ...task, recurrence } : task
            ),
          };
        });
        // Sync to Supabase
        if (updatedTask) {
          get()._setSyncFunctions?.syncTask(updatedTask).catch(console.error);
        }
      },

      toggleTask: (id) => {
        let updatedTask: Task | undefined;
        set((state) => {
          const task = state.tasks.find(t => t.id === id);
          if (!task) return state;
          
          // If task has recurrence and is being completed, reset it
          if (!task.completed && task.recurrence !== 'none') {
            updatedTask = { ...task, completed: true, completedAt: new Date(), lastRecurredAt: new Date() };
            return {
              tasks: state.tasks.map((t) =>
                t.id === id ? updatedTask! : t
              ),
            };
          }
          
          updatedTask = { ...task, completed: !task.completed, completedAt: !task.completed ? new Date() : null };
          return {
            tasks: state.tasks.map((t) =>
              t.id === id ? updatedTask! : t
            ),
          };
        });
        // Sync to Supabase
        if (updatedTask) {
          get()._setSyncFunctions?.syncTask(updatedTask).catch(console.error);
        }
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
        // Delete from Supabase
        get()._setSyncFunctions?.deleteTask(id).catch(console.error);
      },

      // Notes
      addNote: (content, reminder = null, color = 'default', category = 'personal') => {
        const newNote: Note = { 
          id: crypto.randomUUID(), 
          content, 
          createdAt: new Date(), 
          reminder, 
          reminderNotified: false, 
          isLocked: false, 
          color, 
          category 
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
        }));
        // Sync to Supabase
        get()._setSyncFunctions?.syncNote(newNote).catch(console.error);
      },

      updateNoteColor: (id, color) => {
        let updatedNote: Note | undefined;
        set((state) => {
          const note = state.notes.find(n => n.id === id);
          updatedNote = note ? { ...note, color } : undefined;
          return {
            notes: state.notes.map((note) =>
              note.id === id ? { ...note, color } : note
            ),
          };
        });
        // Sync to Supabase
        if (updatedNote) {
          get()._setSyncFunctions?.syncNote(updatedNote).catch(console.error);
        }
      },

      updateNoteCategory: (id, category) => {
        let updatedNote: Note | undefined;
        set((state) => {
          const note = state.notes.find(n => n.id === id);
          updatedNote = note ? { ...note, category } : undefined;
          return {
            notes: state.notes.map((note) =>
              note.id === id ? { ...note, category } : note
            ),
          };
        });
        // Sync to Supabase
        if (updatedNote) {
          get()._setSyncFunctions?.syncNote(updatedNote).catch(console.error);
        }
      },

      updateNoteReminder: (id, reminder) => {
        let updatedNote: Note | undefined;
        set((state) => {
          const note = state.notes.find(n => n.id === id);
          updatedNote = note ? { ...note, reminder, reminderNotified: false } : undefined;
          return {
            notes: state.notes.map((note) =>
              note.id === id ? { ...note, reminder, reminderNotified: false } : note
            ),
          };
        });
        // Sync to Supabase
        if (updatedNote) {
          get()._setSyncFunctions?.syncNote(updatedNote).catch(console.error);
        }
      },

      markNoteNotified: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, reminderNotified: true } : note
          ),
        }));
        // Note: reminderNotified is client-side only, no need to sync
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
        // Delete from Supabase
        get()._setSyncFunctions?.deleteNote(id).catch(console.error);
      },

      toggleNoteLock: (id, password) => {
        let updatedNote: Note | undefined;
        set((state) => {
          const note = state.notes.find(n => n.id === id);
          if (note) {
            updatedNote = { ...note, isLocked: !note.isLocked, password: !note.isLocked ? password : undefined };
          }
          return {
            notes: state.notes.map((note) =>
              note.id === id 
                ? { ...note, isLocked: !note.isLocked, password: !note.isLocked ? password : undefined } 
                : note
            ),
          };
        });
        // Sync to Supabase
        if (updatedNote) {
          get()._setSyncFunctions?.syncNote(updatedNote).catch(console.error);
        }
      },

      // Transactions
      addTransaction: (transaction) => {
        const newTransaction: Transaction = { ...transaction, id: crypto.randomUUID(), createdAt: new Date() };
        set((state) => {
          // Recalculate balance from all transactions (including new one)
          const allTransactions = [newTransaction, ...state.transactions];
          const newBalance = allTransactions.reduce((sum, tx) => {
            return sum + (tx.type === 'income' ? tx.amount : -tx.amount);
          }, 0);
          
          return {
            transactions: allTransactions,
            balance: newBalance,
          };
        });
        // Sync to Supabase
        get()._setSyncFunctions?.syncTransaction(newTransaction).catch(console.error);
        // Sync balance to settings (recalculated from transactions)
        get()._setSyncFunctions?.syncSettings().catch(console.error);
      },

      updateTransaction: (id, updates) => {
        let updatedTransaction: Transaction | undefined;
        set((state) => {
          const transaction = state.transactions.find((t) => t.id === id);
          if (!transaction) return state;
          
          updatedTransaction = { ...transaction, ...updates };
          
          // Recalculate balance from all transactions (with updated one)
          const updatedTransactions = state.transactions.map((t) =>
            t.id === id ? updatedTransaction! : t
          );
          const newBalance = updatedTransactions.reduce((sum, tx) => {
            return sum + (tx.type === 'income' ? tx.amount : -tx.amount);
          }, 0);
          
          return {
            transactions: updatedTransactions,
            balance: newBalance,
          };
        });
        // Sync to Supabase
        if (updatedTransaction) {
          get()._setSyncFunctions?.syncTransaction(updatedTransaction).catch(console.error);
          // Sync balance to settings (recalculated from transactions)
          get()._setSyncFunctions?.syncSettings().catch(console.error);
        }
      },

      deleteTransaction: (id) => {
        set((state) => {
          const transaction = state.transactions.find((t) => t.id === id);
          if (!transaction) return state;
          
          // Recalculate balance from remaining transactions
          const remainingTransactions = state.transactions.filter((t) => t.id !== id);
          const newBalance = remainingTransactions.reduce((sum, tx) => {
            return sum + (tx.type === 'income' ? tx.amount : -tx.amount);
          }, 0);
          
          return {
            transactions: remainingTransactions,
            balance: newBalance,
          };
        });
        // Delete from Supabase
        get()._setSyncFunctions?.deleteTransaction(id).catch(console.error);
        // Sync balance to settings (recalculated from transactions)
        get()._setSyncFunctions?.syncSettings().catch(console.error);
      },

      updateBalance: (amount) => {
        set((state) => ({ balance: state.balance + amount }));
        // Sync to Supabase
        get()._setSyncFunctions?.syncSettings().catch(console.error);
      },

      setBudgetGoal: (goal) => {
        set({ budgetGoal: goal });
        // Sync to Supabase
        get()._setSyncFunctions?.syncGoal('budget', goal).catch(console.error);
      },
      setSavingsGoal: (goal) => {
        set({ savingsGoal: goal });
        // Sync to Supabase
        get()._setSyncFunctions?.syncGoal('savings', goal).catch(console.error);
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setLanguage: (language) => {
        set({ language });
        // Sync to Supabase - use setTimeout to ensure state is updated first
        setTimeout(() => {
          get()._setSyncFunctions?.syncSettings().catch(console.error);
        }, 0);
      },
      updateProfile: (profile) =>
        set((state) => ({ profile: { ...state.profile, ...profile } })),
      
      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (data.storage) {
            const storageData = JSON.parse(data.storage);
            if (storageData.state) {
              set({
                tasks: storageData.state.tasks || [],
                notes: storageData.state.notes || [],
                transactions: storageData.state.transactions || [],
                balance: storageData.state.balance || 0,
                budgetGoal: storageData.state.budgetGoal || null,
                savingsGoal: storageData.state.savingsGoal || null,
                profile: storageData.state.profile || { name: '', email: '', phone: '' },
                language: storageData.state.language || 'tr',
              });
              return true;
            }
          }
          return false;
        } catch {
          return false;
        }
      },
    })
);
