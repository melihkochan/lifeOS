import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { Plus, Check, Trash2, Briefcase, User, ShoppingCart, Heart, MoreHorizontal, Filter, Flag, RefreshCw, ChevronDown, ChevronRight, Calendar, X, Bell, GripVertical, Search, ChevronUp, Clock } from 'lucide-react';
import { useAppStore, TaskCategory, TaskPriority, RecurrenceType, Task } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { differenceInDays, differenceInWeeks, differenceInMonths, format, isToday, isTomorrow, isPast } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

// Detect if device has real touch support (not just emulated)
// This checks for actual touch hardware, not just browser emulation
const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for touch events support
  const hasTouchEvents = 'ontouchstart' in window;
  
  // Check for touch points (more reliable)
  const hasTouchPoints = navigator.maxTouchPoints > 0;
  
  // Check for pointer events with touch capability
  // @ts-ignore
  const hasPointerTouch = navigator.msMaxTouchPoints > 0;
  
  // Additional check: if it's a mobile user agent, likely has touch
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Only return true if we have actual touch support AND it's not just DevTools emulation
  // DevTools emulation doesn't set maxTouchPoints correctly
  return (hasTouchEvents || hasTouchPoints || hasPointerTouch) && isMobileUA;
};

const categories: { id: TaskCategory; icon: typeof Briefcase; color: string }[] = [
  { id: 'work', icon: Briefcase, color: 'text-primary bg-primary/10' },
  { id: 'personal', icon: User, color: 'text-secondary bg-secondary/10' },
  { id: 'shopping', icon: ShoppingCart, color: 'text-warning bg-warning/10' },
  { id: 'health', icon: Heart, color: 'text-destructive bg-destructive/10' },
  { id: 'other', icon: MoreHorizontal, color: 'text-muted-foreground bg-muted' },
];

const priorities: { id: TaskPriority; color: string; bgColor: string; label: Record<string, string> }[] = [
  { id: 'high', color: 'text-destructive', bgColor: 'bg-destructive/10 border-destructive/30', label: { tr: 'Yüksek', en: 'High' } },
  { id: 'medium', color: 'text-warning', bgColor: 'bg-warning/10 border-warning/30', label: { tr: 'Orta', en: 'Medium' } },
  { id: 'low', color: 'text-success', bgColor: 'bg-success/10 border-success/30', label: { tr: 'Düşük', en: 'Low' } },
];

const recurrences: { id: RecurrenceType; label: Record<string, string> }[] = [
  { id: 'none', label: { tr: 'Tekrar Yok', en: 'No Repeat' } },
  { id: 'daily', label: { tr: 'Günlük', en: 'Daily' } },
  { id: 'weekly', label: { tr: 'Haftalık', en: 'Weekly' } },
  { id: 'monthly', label: { tr: 'Aylık', en: 'Monthly' } },
];

const categoryLabels: Record<string, Record<TaskCategory, string>> = {
  tr: { work: 'İş', personal: 'Kişisel', shopping: 'Alışveriş', health: 'Sağlık', other: 'Diğer' },
  en: { work: 'Work', personal: 'Personal', shopping: 'Shopping', health: 'Health', other: 'Other' },
};

// Task Item Component with Touch Support
interface TaskItemProps {
  task: Task;
  isDragging: boolean;
  isDraggingTouch: boolean;
  catData: { id: TaskCategory; icon: typeof Briefcase; color: string };
  priData: { id: TaskPriority; color: string; bgColor: string; label: Record<string, string> };
  CatIcon: typeof Briefcase;
  hasRecurrence: boolean;
  isExpanded: boolean;
  subtaskProgress: { completed: number; total: number } | null;
  dueDateInfo: { label: string; color: string } | null;
  language: 'tr' | 'en';
  labels: Record<TaskCategory, string>;
  getRecurrenceLabel: (recurrence: RecurrenceType) => string;
  dateLocale: typeof tr | typeof enUS;
  toggleTask: (id: string) => void;
  toggleExpanded: (id: string) => void;
  deleteTask: (id: string) => void;
  newSubtask: Record<string, string>;
  setNewSubtask: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleAddSubtask: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  moveTaskUp: (taskId: string) => void;
  moveTaskDown: (taskId: string) => void;
  pendingTasks: Task[];
  handleDragStart: (taskId: string) => void;
  handleDragOver: (e: React.DragEvent, targetTaskId: string) => void;
  handleDrop: (e: React.DragEvent, targetTaskId: string) => void;
  handleDragEnd: () => void;
  setupTouchListeners: (element: HTMLDivElement, taskId: string) => () => void;
}

const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>(({
  task,
  isDragging,
  isDraggingTouch,
  catData,
  priData,
  CatIcon,
  hasRecurrence,
  isExpanded,
  subtaskProgress,
  dueDateInfo,
  language,
  labels,
  getRecurrenceLabel,
  dateLocale,
  toggleTask,
  toggleExpanded,
  deleteTask,
  newSubtask,
  setNewSubtask,
  handleAddSubtask,
  toggleSubtask,
  deleteSubtask,
  moveTaskUp,
  moveTaskDown,
  pendingTasks,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  setupTouchListeners,
}, forwardedRef) => {
  const taskRef = useRef<HTMLDivElement>(null);

  // Setup touch listeners with useEffect (only on real touch devices)
  useEffect(() => {
    const element = taskRef.current;
    if (!element) return;

    return setupTouchListeners(element, task.id);
  }, [task.id, setupTouchListeners]);

  // Combine forwarded ref with internal ref using a callback ref
  const setRefs = useCallback((node: HTMLDivElement | null) => {
    taskRef.current = node;
    if (forwardedRef) {
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else {
        forwardedRef.current = node;
      }
    }
  }, [forwardedRef]);

  return (
    <motion.div
      ref={setRefs}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: (isDragging || isDraggingTouch) ? 0.7 : 1, 
        y: 0,
        scale: (isDragging || isDraggingTouch) ? 1.02 : 1,
        boxShadow: (isDragging || isDraggingTouch) ? '0 8px 30px rgba(0,0,0,0.3)' : '0 0 0 rgba(0,0,0,0)'
      }}
      exit={{ opacity: 0, x: -100 }}
      draggable
      data-task-id={task.id}
      onDragStart={() => handleDragStart(task.id)}
      onDragOver={(e) => handleDragOver(e, task.id)}
      onDrop={(e) => handleDrop(e, task.id)}
      onDragEnd={handleDragEnd}
      className={`widget border-l-2 ${priData.color.replace('text-', 'border-')} cursor-grab active:cursor-grabbing transition-shadow select-none ${(isDragging || isDraggingTouch) ? 'z-50' : ''}`}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="flex items-center gap-2">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-0.5 flex-shrink-0" style={{ touchAction: 'none' }}>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              moveTaskUp(task.id);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            disabled={pendingTasks.indexOf(task) === 0}
            className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            title={language === 'tr' ? 'Yukarı taşı' : 'Move up'}
          >
            <ChevronUp className="w-3 h-3" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              moveTaskDown(task.id);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            disabled={pendingTasks.indexOf(task) === pendingTasks.length - 1}
            className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            title={language === 'tr' ? 'Aşağı taşı' : 'Move down'}
          >
            <ChevronDown className="w-3 h-3" />
          </motion.button>
        </div>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => toggleTask(task.id)}
          className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/20 transition-colors flex-shrink-0"
        >
          {task.completed && <Check className="w-3 h-3 text-primary" />}
        </motion.button>
        <div className={`p-1 rounded-lg ${catData.color}`}>
          <CatIcon className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm block truncate">{task.title}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.createdAt && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {format(new Date(task.createdAt), 'd MMM, HH:mm', { locale: dateLocale })}
              </span>
            )}
            <span className={`text-[10px] ${priData.color}`}>
              {priData.label[language]}
            </span>
            {hasRecurrence && (
              <span className="text-[10px] text-primary flex items-center gap-0.5">
                <RefreshCw className="w-2.5 h-2.5" />
                {getRecurrenceLabel(task.recurrence)}
              </span>
            )}
            {dueDateInfo && (
              <span className={`text-[10px] flex items-center gap-0.5 ${dueDateInfo.color}`}>
                <Calendar className="w-2.5 h-2.5" />
                {dueDateInfo.label}
              </span>
            )}
            {subtaskProgress && (
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${(subtaskProgress.completed / subtaskProgress.total) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {subtaskProgress.completed}/{subtaskProgress.total}
                </span>
              </div>
            )}
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleExpanded(task.id)}
          className="p-1 text-muted-foreground"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => deleteTask(task.id)}
          className="p-1 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
      
      {/* Subtasks */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-7 space-y-1.5 border-l border-border pl-2">
              {(task.subtasks || []).map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSubtask(task.id, subtask.id)}
                    className={`w-3 h-3 rounded border flex items-center justify-center ${
                      subtask.completed ? 'bg-success border-success' : 'border-muted-foreground'
                    }`}
                  >
                    {subtask.completed && <Check className="w-2 h-2 text-success-foreground" />}
                  </button>
                  <span className={`text-xs flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(task.id, subtask.id)}
                    className="p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newSubtask[task.id] || ''}
                  onChange={(e) => setNewSubtask(prev => ({ ...prev, [task.id]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask(task.id)}
                  placeholder={language === 'tr' ? 'Alt görev...' : 'Subtask...'}
                  className="flex-1 bg-muted/50 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={() => handleAddSubtask(task.id)}
                  className="p-1 bg-primary/20 text-primary rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

TaskItem.displayName = 'TaskItem';

export const TasksView = () => {
  const { tasks, addTask, toggleTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, reorderTasks, language } = useAppStore();
  const { t } = useTranslation();
  const [newTask, setNewTask] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('other');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>('medium');
  const [selectedRecurrence, setSelectedRecurrence] = useState<RecurrenceType>('none');
  const [selectedDueDate, setSelectedDueDate] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtask, setNewSubtask] = useState<Record<string, string>>({});
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartTaskId, setTouchStartTaskId] = useState<string | null>(null);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);
  const dragElementRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ y: number; taskId: string } | null>(null);

  const dateLocale = language === 'tr' ? tr : enUS;
  const labels = categoryLabels[language] || categoryLabels.en;

  // Check for due date reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach((task) => {
        if (!task.completed && task.dueDate && !notifiedTasks.has(task.id)) {
          const dueDate = new Date(task.dueDate);
          const daysUntilDue = differenceInDays(dueDate, now);
          
          if (daysUntilDue <= 1 && daysUntilDue >= 0) {
            const message = isToday(dueDate) 
              ? (language === 'tr' ? `"${task.title}" bugün bitiyor!` : `"${task.title}" is due today!`)
              : (language === 'tr' ? `"${task.title}" yarın bitiyor!` : `"${task.title}" is due tomorrow!`);
            
            toast.warning(message, {
              icon: <Bell className="w-4 h-4" />,
              duration: 5000,
            });
            setNotifiedTasks(prev => new Set([...prev, task.id]));
          } else if (isPast(dueDate)) {
            toast.error(
              language === 'tr' ? `"${task.title}" süresi geçti!` : `"${task.title}" is overdue!`,
              { icon: <Bell className="w-4 h-4" />, duration: 5000 }
            );
            setNotifiedTasks(prev => new Set([...prev, task.id]));
          }
        }
      });
    };
    
    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [tasks, language, notifiedTasks]);

  // Check and reset recurring tasks
  useEffect(() => {
    const now = new Date();
    tasks.forEach((task) => {
      if (task.completed && task.recurrence !== 'none' && task.lastRecurredAt) {
        const lastRecurred = new Date(task.lastRecurredAt);
        let shouldReset = false;
        
        if (task.recurrence === 'daily' && differenceInDays(now, lastRecurred) >= 1) {
          shouldReset = true;
        } else if (task.recurrence === 'weekly' && differenceInWeeks(now, lastRecurred) >= 1) {
          shouldReset = true;
        } else if (task.recurrence === 'monthly' && differenceInMonths(now, lastRecurred) >= 1) {
          shouldReset = true;
        }
        
        if (shouldReset) {
          toggleTask(task.id);
        }
      }
    });
  }, [tasks, toggleTask]);

  const handleAddTask = () => {
    if (newTask.trim()) {
      const dueDateValue = selectedDueDate ? new Date(selectedDueDate) : null;
      addTask(newTask.trim(), dueDateValue, selectedCategory, selectedPriority, selectedRecurrence);
      
      setNewTask('');
      setSelectedRecurrence('none');
      setSelectedDueDate('');
      setSelectedCategory('other');
      setSelectedPriority('medium');
      setShowAddModal(false);
    }
  };

  // Filter tasks
  const filteredTasks = filterCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === filterCategory);

  // Get pending tasks - use original task order from store (user can reorder freely)
  const pendingTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  // For display, we use pendingTasks directly (maintaining user's custom order)

  const getDueDateLabel = (dueDate: Date | null | undefined) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isToday(date)) return { label: language === 'tr' ? 'Bugün' : 'Today', color: 'text-warning' };
    if (isTomorrow(date)) return { label: language === 'tr' ? 'Yarın' : 'Tomorrow', color: 'text-primary' };
    if (isPast(date)) return { label: language === 'tr' ? 'Gecikmiş' : 'Overdue', color: 'text-destructive' };
    return { label: format(date, 'd MMM', { locale: dateLocale }), color: 'text-muted-foreground' };
  };

  const getPriorityData = (priority: TaskPriority) => priorities.find(p => p.id === priority) || priorities[1];
  const getCategoryData = (category: TaskCategory) => categories.find(c => c.id === category) || categories[4];
  const getRecurrenceLabel = (recurrence: RecurrenceType) => recurrences.find(r => r.id === recurrence)?.label[language] || '';

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleAddSubtask = (taskId: string) => {
    const title = newSubtask[taskId]?.trim();
    if (title) {
      addSubtask(taskId, title);
      setNewSubtask(prev => ({ ...prev, [taskId]: '' }));
    }
  };

  const getSubtaskProgress = (task: Task) => {
    const subtasks = task.subtasks || [];
    if (subtasks.length === 0) return null;
    const completed = subtasks.filter(st => st.completed).length;
    return { completed, total: subtasks.length };
  };

  // Drag and drop handlers (Desktop - HTML5)
  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetTaskId) return;
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetTaskId) return;

    const pendingTaskIds = pendingTasks.map(t => t.id);
    const draggedIndex = pendingTaskIds.indexOf(draggedTask);
    const targetIndex = pendingTaskIds.indexOf(targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...pendingTaskIds];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTask);

    // Get completed task IDs
    const completedIds = tasks.filter(t => t.completed).map(t => t.id);
    
    // Combine: pending in new order + completed
    reorderTasks([...newOrder, ...completedIds]);
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // Check if device has real touch support (only once on mount)
  const hasTouchSupport = useRef(false);
  
  useEffect(() => {
    hasTouchSupport.current = isTouchDevice();
  }, []);

  // Touch handlers (Mobile - Long press to drag with native listeners)
  // Only works on real touch devices, not in DevTools responsive mode
  const setupTouchListeners = useCallback((element: HTMLDivElement, taskId: string) => {
    // Only setup touch listeners on real touch devices
    if (!hasTouchSupport.current) {
      return () => {}; // Return empty cleanup function
    }

    let longPressTimer: NodeJS.Timeout | null = null;
    let touchStart: { y: number; taskId: string; x: number } | null = null;
    let isDraggingLocal = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Check if touch started on a button or interactive element
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
        return; // Ignore touch on buttons/inputs
      }
      
      // Don't prevent default on touchstart to allow scrolling
      const touch = e.touches[0];
      touchStart = { y: touch.clientY, taskId, x: touch.clientX };
      setTouchStartY(touch.clientY);
      setTouchStartTaskId(taskId);
      isDraggingLocal = false;
      
      // Long press detection (300ms)
      longPressTimer = setTimeout(() => {
        isDraggingLocal = true;
        setDraggedTask(taskId);
        setIsDraggingTouch(true);
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        // Add visual feedback
        element.style.opacity = '0.7';
        element.style.transform = 'scale(1.02)';
        element.style.transition = 'none';
        element.style.zIndex = '50';
      }, 300);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return;
      
      const touch = e.touches[0];
      const deltaY = Math.abs(touch.clientY - touchStart.y);
      const deltaX = Math.abs(touch.clientX - touchStart.x);
      
      // Cancel long press if moved too much before activation
      if (!isDraggingLocal && (deltaY > 10 || deltaX > 10)) {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        return;
      }
      
      // Prevent scrolling while dragging
      if (isDraggingLocal) {
        e.preventDefault();
        e.stopPropagation();
        
        // Visual feedback - move element with finger
        const rect = element.getBoundingClientRect();
        const offsetY = touch.clientY - touchStart.y;
        element.style.transform = `translateY(${offsetY}px) scale(1.02)`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      // Reset visual styles
      element.style.opacity = '';
      element.style.transform = '';
      element.style.transition = '';
      element.style.zIndex = '';

      if (!touchStart || !isDraggingLocal) {
        setTouchStartY(null);
        setTouchStartTaskId(null);
        setIsDraggingTouch(false);
        touchStart = null;
        isDraggingLocal = false;
        return;
      }

      // Find target element from touch position
      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetTaskElement = elementBelow?.closest('[data-task-id]');
      const targetTaskId = targetTaskElement?.getAttribute('data-task-id');

      if (targetTaskId && touchStart.taskId !== targetTaskId) {
        // Get current tasks from store to avoid closure issues
        const store = useAppStore.getState();
        const currentTasks = store.tasks;
        const currentPendingTasks = currentTasks.filter(t => !t.completed);
        const pendingTaskIds = currentPendingTasks.map(t => t.id);
        const draggedIndex = pendingTaskIds.indexOf(touchStart.taskId);
        const targetIndex = pendingTaskIds.indexOf(targetTaskId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newOrder = [...pendingTaskIds];
          newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, touchStart.taskId);

          const completedIds = currentTasks.filter(t => t.completed).map(t => t.id);
          store.reorderTasks([...newOrder, ...completedIds]);
        }
      }

      setTouchStartY(null);
      setTouchStartTaskId(null);
      setDraggedTask(null);
      setIsDraggingTouch(false);
      touchStart = null;
      isDraggingLocal = false;
    };

    // Add native event listeners
    // touchstart: passive true (allow scrolling until long press)
    // touchmove: passive false (need preventDefault when dragging)
    // touchend/touchcancel: passive false (need to handle properly)
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      // Reset styles on cleanup
      element.style.opacity = '';
      element.style.transform = '';
      element.style.transition = '';
      element.style.zIndex = '';
    };
  }, []);

  // Move task up/down with buttons
  const moveTaskUp = (taskId: string) => {
    const pendingTaskIds = pendingTasks.map(t => t.id);
    const currentIndex = pendingTaskIds.indexOf(taskId);
    
    if (currentIndex > 0) {
      const newOrder = [...pendingTaskIds];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      
      const completedIds = tasks.filter(t => t.completed).map(t => t.id);
      reorderTasks([...newOrder, ...completedIds]);
    }
  };

  const moveTaskDown = (taskId: string) => {
    const pendingTaskIds = pendingTasks.map(t => t.id);
    const currentIndex = pendingTaskIds.indexOf(taskId);
    
    if (currentIndex < pendingTaskIds.length - 1) {
      const newOrder = [...pendingTaskIds];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      
      const completedIds = tasks.filter(t => t.completed).map(t => t.id);
      reorderTasks([...newOrder, ...completedIds]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div>
        <h1 className="text-2xl font-bold mb-1">{t.tasks}</h1>
        <p className="text-muted-foreground text-sm">
          {pendingTasks.length} {t.pendingCount}
        </p>
      </div>

      {/* Category Filter with touch scroll - Sadece görevleri olan kategorileri göster */}
      <div 
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilterCategory('all')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
            filterCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Filter className="w-3 h-3" />
          {language === 'tr' ? 'Tümü' : 'All'}
        </motion.button>
        {categories
          .filter(cat => {
            // Sadece görevleri olan kategorileri göster
            const hasTasks = tasks.some(t => t.category === cat.id);
            return hasTasks;
          })
          .map((cat) => {
            const Icon = cat.icon;
            const taskCount = tasks.filter(t => t.category === cat.id).length;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterCategory(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  filterCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-3 h-3" />
                {labels[cat.id]}
                {taskCount > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({taskCount})</span>
                )}
              </motion.button>
            );
          })}
      </div>

      {/* Quick Add */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (newTask.trim() ? setShowAddModal(true) : null)}
          placeholder={t.addNewTask}
          className="input-glass flex-1"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => newTask.trim() && setShowAddModal(true)}
          className="btn-primary px-4"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Pending Tasks with Drag and Drop */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {pendingTasks.map((task) => {
            const catData = getCategoryData(task.category || 'other');
            const priData = getPriorityData(task.priority || 'medium');
            const CatIcon = catData.icon;
            const hasRecurrence = task.recurrence && task.recurrence !== 'none';
            const isExpanded = expandedTasks.has(task.id);
            const subtaskProgress = getSubtaskProgress(task);
            const dueDateInfo = getDueDateLabel(task.dueDate);
            const isDragging = draggedTask === task.id;
            
            return (
              <TaskItem
                key={task.id}
                task={task}
                isDragging={isDragging}
                isDraggingTouch={isDraggingTouch}
                catData={catData}
                priData={priData}
                CatIcon={CatIcon}
                hasRecurrence={hasRecurrence}
                isExpanded={isExpanded}
                subtaskProgress={subtaskProgress}
                dueDateInfo={dueDateInfo}
                language={language}
                labels={labels}
                getRecurrenceLabel={getRecurrenceLabel}
                dateLocale={dateLocale}
                toggleTask={toggleTask}
                toggleExpanded={toggleExpanded}
                deleteTask={deleteTask}
                newSubtask={newSubtask}
                setNewSubtask={setNewSubtask}
                handleAddSubtask={handleAddSubtask}
                toggleSubtask={toggleSubtask}
                deleteSubtask={deleteSubtask}
                moveTaskUp={moveTaskUp}
                moveTaskDown={moveTaskDown}
                pendingTasks={pendingTasks}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
                setupTouchListeners={setupTouchListeners}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            {t.completed} ({completedTasks.length})
          </h2>
          <div className="space-y-2">
            {completedTasks.map((task) => {
              const catData = getCategoryData(task.category || 'other');
              const CatIcon = catData.icon;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="widget flex items-center gap-2"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="w-5 h-5 rounded-full bg-success flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-success-foreground" />
                  </button>
                  <div className={`p-1 rounded-lg ${catData.color} opacity-50`}>
                    <CatIcon className="w-3 h-3" />
                  </div>
                  <span className="text-sm truncate line-through text-muted-foreground flex-1">
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Task Modal - Fixed z-index and padding bottom */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background rounded-t-3xl p-5 pb-8 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Görev Detayları' : 'Task Details'}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 -mr-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-sm font-medium">{newTask}</p>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{language === 'tr' ? 'Kategori' : 'Category'}</p>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedCategory === cat.id 
                            ? `${cat.color} ring-2 ring-offset-2 ring-offset-background ring-primary/50` 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {labels[cat.id]}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{language === 'tr' ? 'Öncelik' : 'Priority'}</p>
                <div className="flex gap-2">
                  {priorities.map((pri) => (
                    <motion.button
                      key={pri.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPriority(pri.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border ${
                        selectedPriority === pri.id 
                          ? `${pri.bgColor} ${pri.color}` 
                          : 'bg-muted text-muted-foreground border-transparent'
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                      {pri.label[language]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{language === 'tr' ? 'Tekrar' : 'Repeat'}</p>
                <div className="flex gap-2 flex-wrap">
                  {recurrences.map((rec) => (
                    <motion.button
                      key={rec.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedRecurrence(rec.id)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedRecurrence === rec.id 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {rec.id !== 'none' && <RefreshCw className="w-3.5 h-3.5" />}
                      {rec.label[language]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{language === 'tr' ? 'Son Tarih' : 'Due Date'}</p>
                <input
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddTask}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <Plus className="w-5 h-5" />
                {language === 'tr' ? 'Görev Ekle' : 'Add Task'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
