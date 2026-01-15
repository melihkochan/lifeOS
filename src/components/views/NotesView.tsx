import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Bell, BellOff, Clock, Lock, Unlock, Eye, EyeOff, Briefcase, User, Lightbulb, CheckSquare, AlertCircle, MoreHorizontal, Palette, Filter, Search, Info, X } from 'lucide-react';
import { useAppStore, NoteColor, NoteCategory } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { parseMarkdown, markdownHelpText } from '@/lib/markdown';

const noteColors: { id: NoteColor; bg: string; border: string }[] = [
  { id: 'default', bg: 'bg-card', border: 'border-border' },
  { id: 'red', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { id: 'orange', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { id: 'yellow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { id: 'green', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { id: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { id: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { id: 'pink', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
];

const colorDots: { id: NoteColor; dot: string }[] = [
  { id: 'default', dot: 'bg-muted-foreground' },
  { id: 'red', dot: 'bg-red-500' },
  { id: 'orange', dot: 'bg-orange-500' },
  { id: 'yellow', dot: 'bg-yellow-500' },
  { id: 'green', dot: 'bg-green-500' },
  { id: 'blue', dot: 'bg-blue-500' },
  { id: 'purple', dot: 'bg-purple-500' },
  { id: 'pink', dot: 'bg-pink-500' },
];

const noteCategories: { id: NoteCategory; icon: typeof Briefcase; label: Record<string, string> }[] = [
  { id: 'personal', icon: User, label: { tr: 'Kişisel', en: 'Personal' } },
  { id: 'work', icon: Briefcase, label: { tr: 'İş', en: 'Work' } },
  { id: 'ideas', icon: Lightbulb, label: { tr: 'Fikirler', en: 'Ideas' } },
  { id: 'todo', icon: CheckSquare, label: { tr: 'Yapılacak', en: 'To-Do' } },
  { id: 'important', icon: AlertCircle, label: { tr: 'Önemli', en: 'Important' } },
  { id: 'other', icon: MoreHorizontal, label: { tr: 'Diğer', en: 'Other' } },
];

export const NotesView = () => {
  const { notes, addNote, deleteNote, updateNoteReminder, updateNoteColor, updateNoteCategory, toggleNoteLock, language } = useAppStore();
  const { t } = useTranslation();
  const [newNote, setNewNote] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<NoteColor>('default');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('personal');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [showReminderInput, setShowReminderInput] = useState(false);
  // Load unlocked notes from localStorage on mount
  const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('lifeOS-unlockedNotes');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        return new Set(parsed);
      }
    } catch (error) {
      console.error('Error loading unlocked notes:', error);
    }
    return new Set();
  });
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  
  // Save unlocked notes to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('lifeOS-unlockedNotes', JSON.stringify(Array.from(unlockedNotes)));
    } catch (error) {
      console.error('Error saving unlocked notes:', error);
    }
  }, [unlockedNotes]);
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [filterCategory, setFilterCategory] = useState<NoteCategory | 'all'>('all');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);

  const dateLocale = language === 'tr' ? tr : enUS;

  // Clean up unlocked notes that no longer exist (when notes are deleted)
  useEffect(() => {
    const noteIds = new Set(notes.map(n => n.id));
    const validUnlockedNotes = new Set(
      Array.from(unlockedNotes).filter(id => noteIds.has(id))
    );
    
    if (validUnlockedNotes.size !== unlockedNotes.size) {
      setUnlockedNotes(validUnlockedNotes);
    }
  }, [notes]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      let reminder: Date | null = null;
      if (reminderDate && reminderTime) {
        reminder = new Date(`${reminderDate}T${reminderTime}`);
      }
      
      addNote(newNote.trim(), reminder, selectedColor, selectedCategory);
      
      setNewNote('');
      setReminderDate('');
      setReminderTime('');
      setShowReminderInput(false);
      setSelectedColor('default');
      setSelectedCategory('personal');
      setShowAddModal(false);
      toast.success(language === 'tr' ? 'Not eklendi' : 'Note added');
    }
  };

  const handleRemoveReminder = (noteId: string) => {
    updateNoteReminder(noteId, null);
  };

  const handleUnlock = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const input = passwordInputs[noteId] || '';
    if (input === note.password) {
      // Unlock the note in database (set is_locked to false)
      if (note.isLocked) {
        toggleNoteLock(noteId);
      }
      
      const newUnlockedNotes = new Set([...unlockedNotes, noteId]);
      setUnlockedNotes(newUnlockedNotes);
      // Save to localStorage immediately
      try {
        localStorage.setItem('lifeOS-unlockedNotes', JSON.stringify(Array.from(newUnlockedNotes)));
      } catch (error) {
        console.error('Error saving unlocked notes:', error);
      }
      setPasswordInputs(prev => ({ ...prev, [noteId]: '' }));
      toast.success(language === 'tr' ? 'Not açıldı' : 'Note unlocked');
    } else {
      toast.error(t.wrongPassword);
    }
  };

  const handleLock = (noteId: string) => {
    if (!newPassword.trim()) return;
    toggleNoteLock(noteId, newPassword);
    setShowPasswordModal(null);
    setNewPassword('');
    toast.success(t.lockNote + '!');
  };

  const handleUnlockNote = (noteId: string) => {
    toggleNoteLock(noteId);
    const newUnlockedNotes = new Set(unlockedNotes);
    newUnlockedNotes.delete(noteId);
    setUnlockedNotes(newUnlockedNotes);
    // Save to localStorage immediately
    try {
      localStorage.setItem('lifeOS-unlockedNotes', JSON.stringify(Array.from(newUnlockedNotes)));
    } catch (error) {
      console.error('Error saving unlocked notes:', error);
    }
    toast.success(t.unlockNote + '!');
  };

  const getColorData = (color: NoteColor) => noteColors.find(c => c.id === color) || noteColors[0];
  const getColorDot = (color: NoteColor) => colorDots.find(c => c.id === color) || colorDots[0];
  const getCategoryData = (category: NoteCategory) => noteCategories.find(c => c.id === category) || noteCategories[0];

  // Filter notes by category and search query
  const filteredNotes = notes.filter(note => {
    const matchesCategory = filterCategory === 'all' || (note.category || 'personal') === filterCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCategoryData(note.category || 'personal').label[language].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div>
        <h1 className="text-2xl font-bold mb-1">{t.notes}</h1>
        <p className="text-muted-foreground text-sm">{notes.length} {t.noteCount}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'tr' ? 'Notlarda ara...' : 'Search notes...'}
          className="input-glass w-full pl-10"
        />
      </div>

      {/* Category Filter with touch scroll - Sadece notları olan kategorileri göster */}
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
        {noteCategories
          .filter(cat => {
            // Sadece notları olan kategorileri göster
            const hasNotes = notes.some(n => (n.category || 'personal') === cat.id);
            return hasNotes;
          })
          .map((cat) => {
            const Icon = cat.icon;
            const noteCount = notes.filter(n => (n.category || 'personal') === cat.id).length;
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
                {cat.label[language]}
                {noteCount > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({noteCount})</span>
                )}
              </motion.button>
            );
          })}
      </div>

      {/* Quick Add - Like TasksView */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (newNote.trim() ? setShowAddModal(true) : null)}
          placeholder={t.quickNote}
          className="input-glass flex-1"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => newNote.trim() && setShowAddModal(true)}
          className="btn-primary px-4"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Notes List - Compact Cards */}
      <div className="grid grid-cols-2 gap-2">
        <AnimatePresence mode="popLayout">
          {filteredNotes.map((note, index) => {
            const colorData = getColorData(note.color || 'default');
            const categoryData = getCategoryData(note.category || 'personal');
            const CategoryIcon = categoryData.icon;
            
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.02 }}
                className={`rounded-xl p-3 border ${colorData.bg} ${colorData.border} backdrop-blur-xl transition-all`}
              >
                {note.isLocked && !unlockedNotes.has(note.id) ? (
                  // Locked view - compact with proper overflow handling
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{t.lockedNote}</span>
                    </div>
                    <div className="flex gap-1.5 min-w-0">
                      <input
                        type="password"
                        value={passwordInputs[note.id] || ''}
                        onChange={(e) => setPasswordInputs(prev => ({ ...prev, [note.id]: e.target.value }))}
                        placeholder="••••"
                        className="input-glass flex-1 min-w-0 text-xs py-1.5 px-2"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUnlock(note.id);
                            // Clear password input after unlock attempt
                            setPasswordInputs(prev => ({ ...prev, [note.id]: '' }));
                          }
                        }}
                      />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          handleUnlock(note.id);
                          // Clear password input after unlock attempt
                          setPasswordInputs(prev => ({ ...prev, [note.id]: '' }));
                        }}
                        className="px-2.5 bg-primary text-primary-foreground rounded-lg flex-shrink-0 flex items-center justify-center"
                        title={language === 'tr' ? 'Kilidi aç' : 'Unlock'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  // Unlocked view - compact
                  <>
                    {/* Date/Time at top left */}
                    {note.createdAt && (
                      <div className="mb-1.5">
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {format(new Date(note.createdAt), 'd MMM, HH:mm', { locale: dateLocale })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <CategoryIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-[10px] text-muted-foreground truncate">{categoryData.label[language]}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Color Picker */}
                        <div className="relative">
                          <button
                            onClick={() => setShowColorPicker(showColorPicker === note.id ? null : note.id)}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors"
                            title={language === 'tr' ? 'Renk değiştir' : 'Change color'}
                          >
                            <Palette className="w-3 h-3" />
                          </button>
                          <AnimatePresence>
                            {showColorPicker === note.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-0 top-full mt-1 p-1.5 bg-background rounded-lg shadow-lg border flex gap-1 z-10"
                              >
                                {colorDots.map((color) => (
                                  <button
                                    key={color.id}
                                    onClick={() => {
                                      updateNoteColor(note.id, color.id);
                                      setShowColorPicker(null);
                                    }}
                                    className={`w-4 h-4 rounded-full ${color.dot} transition-all hover:scale-110`}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {!note.isLocked && (
                          <button
                            onClick={() => setShowPasswordModal(note.id)}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors"
                            title={language === 'tr' ? 'Kilitle' : 'Lock'}
                          >
                            <Lock className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title={language === 'tr' ? 'Sil' : 'Delete'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs leading-relaxed line-clamp-4 break-words">
                      {parseMarkdown(note.content)}
                    </div>

                    {/* Reminder Badge */}
                    {note.reminder && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/10">
                        <div className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                          note.reminderNotified 
                            ? 'bg-muted text-muted-foreground' 
                            : 'bg-primary/20 text-primary'
                        }`}>
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {format(new Date(note.reminder), 'd MMM HH:mm', { locale: dateLocale })}
                          </span>
                        </div>
                        {!note.reminderNotified && (
                          <button
                            onClick={() => handleRemoveReminder(note.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <BellOff className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* No results */}
      {filteredNotes.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{language === 'tr' ? 'Sonuç bulunamadı' : 'No results found'}</p>
        </div>
      )}

      {/* Add Note Modal - Modern like TasksView */}
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
                <h3 className="text-lg font-semibold">{language === 'tr' ? 'Not Detayları' : 'Note Details'}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 -mr-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-muted/50 rounded-xl">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={`${t.quickNote} (${language === 'tr' ? 'Markdown desteklenir' : 'Markdown supported'})`}
                  className="w-full bg-transparent resize-none text-sm min-h-[80px] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Color Selector */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{language === 'tr' ? 'Renk' : 'Color'}</p>
                <div className="flex gap-2 flex-wrap">
                  {colorDots.map((color) => (
                    <motion.button
                      key={color.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedColor(color.id)}
                      className={`w-8 h-8 rounded-full ${color.dot} transition-all ${
                        selectedColor === color.id ? 'ring-2 ring-offset-2 ring-primary ring-offset-background scale-110' : 'hover:scale-105'
                      }`}
                      title={color.id === 'default' ? (language === 'tr' ? 'Varsayılan' : 'Default') : color.id}
                    />
                  ))}
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{language === 'tr' ? 'Kategori' : 'Category'}</p>
                <div className="flex gap-2 flex-wrap">
                  {noteCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedCategory === cat.id 
                            ? 'bg-primary/20 text-primary ring-2 ring-offset-2 ring-offset-background ring-primary/50' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cat.label[language]}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Reminder */}
              <div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowReminderInput(!showReminderInput)}
                  className={`w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all ${
                    showReminderInput ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {t.setReminder}
                </motion.button>
                <AnimatePresence>
                  {showReminderInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2 mt-2"
                    >
                      <input
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="input-glass flex-1"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="input-glass flex-1"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddNote}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <Plus className="w-5 h-5" />
                {language === 'tr' ? 'Not Ekle' : 'Add Note'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowPasswordModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-background rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">{t.lockNote}</h3>
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.enterPassword}
                className="input-glass w-full"
                onKeyPress={(e) => e.key === 'Enter' && handleLock(showPasswordModal)}
              />
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPasswordModal(null)}
                  className="flex-1 py-2 bg-muted text-muted-foreground rounded-xl"
                >
                  {language === 'tr' ? 'İptal' : 'Cancel'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLock(showPasswordModal)}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl"
                >
                  {t.lockNote}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
