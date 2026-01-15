import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, ShoppingBag, Utensils, Car, Film, Briefcase, PiggyBank, MoreHorizontal, Wallet, Target, Edit2, Check, X, AlertTriangle, ExternalLink, Clock, Save } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

interface WalletToolProps {
  onOpenBudget?: () => void;
}

const incomeCategories = [
  { id: 'salary', icon: Briefcase, labelTr: 'Maaş', labelEn: 'Salary' },
  { id: 'freelance', icon: Wallet, labelTr: 'Serbest', labelEn: 'Freelance' },
  { id: 'investment', icon: PiggyBank, labelTr: 'Yatırım', labelEn: 'Investment' },
  { id: 'other', icon: MoreHorizontal, labelTr: 'Diğer', labelEn: 'Other' },
];

const expenseCategories = [
  { id: 'food', icon: Utensils, labelTr: 'Yemek', labelEn: 'Food' },
  { id: 'shopping', icon: ShoppingBag, labelTr: 'Alışveriş', labelEn: 'Shopping' },
  { id: 'transport', icon: Car, labelTr: 'Ulaşım', labelEn: 'Transport' },
  { id: 'entertainment', icon: Film, labelTr: 'Eğlence', labelEn: 'Entertainment' },
  { id: 'other', icon: MoreHorizontal, labelTr: 'Diğer', labelEn: 'Other' },
];

export const WalletTool = ({ onOpenBudget }: WalletToolProps) => {
  const { balance, transactions, addTransaction, updateTransaction, deleteTransaction, language, budgetGoal, setBudgetGoal } = useAppStore();
  const { t } = useTranslation();
  const { syncTransaction, deleteTransaction: deleteTransactionFromDb, syncSettings } = useSupabaseData();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isBudgetFocused, setIsBudgetFocused] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<{ id: string; title: string; amount: number; type: 'income' | 'expense'; category: string } | null>(null);

  const dateLocale = language === 'tr' ? tr : enUS;
  const categories = type === 'income' ? incomeCategories : expenseCategories;

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

  // Initialize newBudget with formatted value
  const [newBudget, setNewBudget] = useState(() => {
    return budgetGoal ? formatNumber(budgetGoal.toString()) : '';
  });

  // Handle amount input change with real-time formatting and cursor position preservation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    // Count how many digits were before cursor in original
    const digitsBeforeCursor = inputValue.substring(0, cursorPosition).replace(/\D/g, '').length;
    
    // Find equivalent position in formatted string
    let newCursorPos = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length && digitCount < digitsBeforeCursor; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      newCursorPos = i + 1;
    }
    
    setAmount(formatted);
    
    // Restore cursor position
    requestAnimationFrame(() => {
      input.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  // Format on blur (ensure proper formatting)
  const handleAmountBlur = () => {
    setIsAmountFocused(false);
    if (amount) {
      const formatted = formatNumber(amount);
      setAmount(formatted);
    }
  };

  // Budget calculations
  const now = new Date();
  const thisMonthExpenses = transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return tx.type === 'expense' && 
             txDate.getMonth() === now.getMonth() && 
             txDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const budgetProgress = budgetGoal ? Math.min((thisMonthExpenses / budgetGoal) * 100, 100) : 0;
  const budgetRemaining = budgetGoal ? budgetGoal - thisMonthExpenses : 0;
  const isOverBudget = budgetRemaining < 0;

  // Handle budget input change with real-time formatting
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setNewBudget(formatted);
    
    // Restore cursor position
    setTimeout(() => {
      const newLength = formatted.length;
      const oldLength = inputValue.length;
      const lengthDiff = newLength - oldLength;
      let newCursorPos = cursorPosition + lengthDiff;
      
      // Adjust cursor position based on formatting
      if (lengthDiff > 0) {
        // Added separators, adjust cursor
        const beforeCursor = inputValue.substring(0, cursorPosition);
        const beforeCursorCleaned = beforeCursor.replace(/\./g, '').replace(',', '.');
        const formattedBefore = formatNumber(beforeCursorCleaned);
        newCursorPos = formattedBefore.length;
      }
      
      newCursorPos = Math.max(0, Math.min(newCursorPos, formatted.length));
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBudgetBlur = () => {
    setIsBudgetFocused(false);
    // Ensure proper formatting on blur
    if (newBudget) {
      const parsed = parseFormattedNumber(newBudget);
      if (parsed > 0) {
        setNewBudget(formatNumber(parsed.toString()));
      }
    }
  };

  const handleSaveBudget = () => {
    const goal = parseFormattedNumber(newBudget);
    if (isNaN(goal) || goal <= 0) {
      toast.error(t.invalidAmount || 'Geçersiz tutar');
      return;
    }
    setBudgetGoal(goal);
    setIsEditingBudget(false);
    toast.success(t.budgetGoalSet || 'Bütçe hedefi belirlendi');
  };

  const getProgressColor = () => {
    if (budgetProgress >= 100) return 'bg-destructive';
    if (budgetProgress >= 80) return 'bg-warning';
    return 'bg-success';
  };

  const handleAdd = async () => {
    if (isAdding) return; // Prevent duplicate clicks
    
    if (!title.trim() || !amount) {
      toast.error(language === 'tr' ? 'Lütfen tüm alanları doldurun' : 'Please fill all fields');
      return;
    }

    const numericAmount = parseFormattedNumber(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error(language === 'tr' ? 'Geçersiz tutar' : 'Invalid amount');
      return;
    }

    // Check for duplicate transaction (same title, amount, type within last 10 seconds)
    const now = new Date();
    const recentDuplicate = transactions.find(tx => {
      const txDate = new Date(tx.createdAt);
      const timeDiff = now.getTime() - txDate.getTime();
      return tx.title === title.trim() && 
             Math.abs(tx.amount - numericAmount) < 0.01 && 
             tx.type === type &&
             timeDiff < 10000; // 10 seconds (increased from 5)
    });

    if (recentDuplicate) {
      toast.error(language === 'tr' ? 'Bu işlem zaten eklenmiş' : 'This transaction already exists');
      return;
    }

    setIsAdding(true);
    
    try {
      const transactionData = {
        title: title.trim(),
        amount: numericAmount,
        type,
        category,
      };
      
      // addTransaction already syncs to database internally, no need to call syncTransaction again
      addTransaction(transactionData);
      
      setTitle('');
      setAmount('');
      toast.success(language === 'tr' ? 'İşlem eklendi' : 'Transaction added');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(language === 'tr' ? 'İşlem eklenirken hata oluştu' : 'Error adding transaction');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (tx: typeof transactions[0]) => {
    setEditingTransaction({
      id: tx.id,
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
    });
    setType(tx.type);
    setCategory(tx.category);
    setTitle(tx.title);
    setAmount(tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    
    if (!title.trim() || !amount) {
      toast.error(language === 'tr' ? 'Lütfen tüm alanları doldurun' : 'Please fill all fields');
      return;
    }

    const numericAmount = parseFormattedNumber(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error(language === 'tr' ? 'Geçersiz tutar' : 'Invalid amount');
      return;
    }

    try {
      updateTransaction(editingTransaction.id, {
        title: title.trim(),
        amount: numericAmount,
        type,
        category,
      });
      
      setEditingTransaction(null);
      setTitle('');
      setAmount('');
      setCategory('other');
      setType('expense');
      toast.success(language === 'tr' ? 'İşlem güncellendi' : 'Transaction updated');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error(language === 'tr' ? 'İşlem güncellenirken hata oluştu' : 'Error updating transaction');
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setTitle('');
    setAmount('');
    setCategory('other');
    setType('expense');
  };

  return (
    <div className="space-y-4">
      {/* Balance Display */}
      <div className="widget text-center">
        <p className="text-muted-foreground text-sm">{t.currentBalance}</p>
        <p className={`text-3xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
          {balance < 0 && '-'}₺{Math.abs(balance).toLocaleString()}
        </p>
      </div>

      {/* Budget Goal Section */}
      <div className="widget">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{t.monthlyLimit || 'Aylık Limit'}</span>
          </div>
          <div className="flex gap-1">
            {onOpenBudget && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onOpenBudget}
                className="p-1.5 rounded-lg bg-primary/10 text-primary"
                title={language === 'tr' ? 'Detaylar' : 'Details'}
              >
                <ExternalLink className="w-3 h-3" />
              </motion.button>
            )}
            {!isEditingBudget ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setNewBudget(budgetGoal ? formatNumber(budgetGoal.toString()) : '');
                setIsEditingBudget(true);
              }}
                className="p-1.5 rounded-lg bg-muted"
              >
                <Edit2 className="w-3 h-3" />
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSaveBudget}
                  className="p-1.5 rounded-lg bg-success/20 text-success"
                >
                  <Check className="w-3 h-3" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditingBudget(false)}
                  className="p-1.5 rounded-lg bg-destructive/20 text-destructive"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {isEditingBudget ? (
          <div className="flex items-center gap-2">
            <span className="font-bold">₺</span>
            <input
              type="text"
              inputMode="decimal"
              value={newBudget}
              onChange={handleBudgetChange}
              onFocus={() => setIsBudgetFocused(true)}
              onBlur={handleBudgetBlur}
              className="input-glass flex-1 text-lg font-bold"
              placeholder="0"
              autoFocus
            />
          </div>
        ) : budgetGoal ? (
          <>
            <div className="flex justify-between text-sm mb-1">
              <span className={isOverBudget ? 'text-destructive' : 'text-muted-foreground'}>
                ₺{thisMonthExpenses.toLocaleString()} / ₺{budgetGoal.toLocaleString()}
              </span>
              <span className={isOverBudget ? 'text-destructive' : 'text-success'}>
                {isOverBudget ? (t.budgetExceeded || 'Aşıldı') : `₺${budgetRemaining.toLocaleString()} ${t.remaining || 'kaldı'}`}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetProgress}%` }}
                className={`h-full ${getProgressColor()} rounded-full`}
              />
            </div>
            {budgetProgress >= 80 && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                <AlertTriangle className={`w-3 h-3 ${isOverBudget ? 'text-destructive' : 'text-warning'}`} />
                <span className={isOverBudget ? 'text-destructive' : 'text-warning'}>
                  {isOverBudget ? (t.budgetExceeded || 'Limit aşıldı!') : (t.budgetWarning || 'Limite yaklaşıyorsunuz!')}
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t.budgetGoalDesc || 'Limit belirlemek için düzenle'}</p>
        )}
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { 
            setType('income'); 
            setCategory('salary');
            const salaryLabel = language === 'tr' ? incomeCategories.find(c => c.id === 'salary')?.labelTr : incomeCategories.find(c => c.id === 'salary')?.labelEn;
            if (salaryLabel) setTitle(salaryLabel);
          }}
          className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            type === 'income'
              ? 'bg-success text-success-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          {t.addIncome}
        </button>
        <button
          onClick={() => { 
            setType('expense'); 
            setCategory('food');
            const foodLabel = language === 'tr' ? expenseCategories.find(c => c.id === 'food')?.labelTr : expenseCategories.find(c => c.id === 'food')?.labelEn;
            if (foodLabel) setTitle(foodLabel);
          }}
          className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            type === 'expense'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          {t.addExpense}
        </button>
      </div>

      {/* Form */}
      <div className="widget space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.transactionDesc}
          className="input-glass w-full"
        />
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          onFocus={() => setIsAmountFocused(true)}
          onBlur={handleAmountBlur}
          placeholder={`${t.amount} (₺)`}
          className="input-glass w-full"
          inputMode="decimal"
        />

        {/* Categories */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const label = language === 'tr' ? cat.labelTr : cat.labelEn;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  // Always auto-fill description with category name when category changes
                  setTitle(label);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                  category === cat.id
                    ? type === 'income' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          disabled={isAdding}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
            type === 'income' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
          } ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Plus className="w-5 h-5" />
          {isAdding ? (language === 'tr' ? 'Ekleniyor...' : 'Adding...') : t.add}
        </motion.button>
      </div>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 w-full max-w-md border border-border shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {language === 'tr' ? 'İşlem Düzenle' : 'Edit Transaction'}
                </h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Type Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setType('income')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    type === 'income' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {language === 'tr' ? 'Gelir' : 'Income'}
                </button>
                <button
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    type === 'expense' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {language === 'tr' ? 'Gider' : 'Expense'}
                </button>
              </div>

              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'tr' ? 'Açıklama' : 'Description'}
                className="input-glass w-full mb-4"
              />

              {/* Amount Input */}
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                onFocus={() => setIsAmountFocused(true)}
                onBlur={handleAmountBlur}
                placeholder={`${t.amount} (₺)`}
                className="input-glass w-full mb-4"
                inputMode="decimal"
              />

              {/* Category Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => {
                  const Icon = cat.icon;
                  const label = language === 'tr' ? cat.labelTr : cat.labelEn;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        setTitle(label);
                      }}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                        category === cat.id
                          ? type === 'income' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 rounded-xl font-semibold bg-muted text-muted-foreground"
                >
                  {language === 'tr' ? 'İptal' : 'Cancel'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveEdit}
                  className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                    type === 'income' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  {language === 'tr' ? 'Kaydet' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions List */}
      {transactions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">{t.recentTransactions}</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {transactions.slice(0, 10).map((tx) => {
                const isIncome = tx.type === 'income';
                const allCategories = [...incomeCategories, ...expenseCategories];
                const catData = allCategories.find((c) => c.id === tx.category);
                const Icon = catData?.icon || MoreHorizontal;

                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="widget flex items-center gap-3 py-3"
                  >
                    <div className={`p-2 rounded-xl ${isIncome ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{tx.title}</p>
                      {tx.createdAt && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{format(new Date(tx.createdAt), 'd MMM, HH:mm', { locale: dateLocale })}</span>
                        </p>
                      )}
                    </div>
                    <span className={`font-bold text-sm ${isIncome ? 'text-success' : 'text-destructive'}`}>
                      {isIncome ? '+' : '-'}₺{tx.amount.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handleEdit(tx)}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        title={language === 'tr' ? 'Düzenle' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        title={language === 'tr' ? 'Sil' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
