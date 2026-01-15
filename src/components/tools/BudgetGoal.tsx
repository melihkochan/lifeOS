import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingDown, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';

export const BudgetGoal = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const { transactions, budgetGoal, setBudgetGoal } = useAppStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newGoal, setNewGoal] = useState(budgetGoal?.toString() || '');

  const now = new Date();
  const thisMonthExpenses = transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return tx.type === 'expense' && 
             txDate.getMonth() === now.getMonth() && 
             txDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const thisMonthIncome = transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return tx.type === 'income' && 
             txDate.getMonth() === now.getMonth() && 
             txDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const progress = budgetGoal ? Math.min((thisMonthExpenses / budgetGoal) * 100, 100) : 0;
  const remaining = budgetGoal ? budgetGoal - thisMonthExpenses : 0;
  const isOverBudget = remaining < 0;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();
  const daysRemaining = daysInMonth - daysPassed;
  const dailyBudget = remaining > 0 ? remaining / daysRemaining : 0;

  const handleSaveGoal = () => {
    const goal = parseFloat(newGoal);
    if (isNaN(goal) || goal <= 0) {
      toast.error(t.invalidAmount || 'Geçersiz tutar');
      return;
    }
    setBudgetGoal(goal);
    setIsEditing(false);
    toast.success(t.budgetGoalSet || 'Bütçe hedefi belirlendi');
  };

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-destructive';
    if (progress >= 80) return 'bg-warning';
    return 'bg-success';
  };

  const expensesByCategory = transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return tx.type === 'expense' && 
             txDate.getMonth() === now.getMonth() && 
             txDate.getFullYear() === now.getFullYear();
    })
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryColors: Record<string, string> = {
    food: 'bg-orange-500',
    shopping: 'bg-pink-500',
    transport: 'bg-blue-500',
    entertainment: 'bg-purple-500',
    other: 'bg-gray-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <button onClick={onBack} className="text-primary text-sm mb-2 hover:underline">
          ← {t.back}
        </button>
        <h1 className="text-2xl font-bold">{t.budgetGoalTitle || 'Aylık Bütçe'}</h1>
        <p className="text-muted-foreground text-sm">{t.budgetGoalDesc || 'Harcama limitini belirle ve takip et'}</p>
      </div>

      {/* Budget Goal Card */}
      <div className="widget">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-semibold">{t.monthlyLimit || 'Aylık Limit'}</span>
          </div>
          {!isEditing ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setNewGoal(budgetGoal?.toString() || '');
                setIsEditing(true);
              }}
              className="p-2 rounded-lg bg-muted"
            >
              <Edit2 className="w-4 h-4" />
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSaveGoal}
                className="p-2 rounded-lg bg-success/20 text-success"
              >
                <Check className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-lg bg-destructive/20 text-destructive"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">₺</span>
            <input
              type="number"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              className="input-glass flex-1 text-2xl font-bold"
              placeholder="0"
              autoFocus
            />
          </div>
        ) : (
          <div className="text-3xl font-bold">
            ₺{budgetGoal?.toLocaleString() || '0'}
          </div>
        )}

        {budgetGoal && (
          <>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t.spent || 'Harcanan'}</span>
                <span className={isOverBudget ? 'text-destructive' : ''}>
                  ₺{thisMonthExpenses.toLocaleString()} / ₺{budgetGoal.toLocaleString()}
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${getProgressColor()} rounded-full`}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{progress.toFixed(0)}%</span>
                <span>{100 - progress > 0 ? `${(100 - progress).toFixed(0)}% ${t.remaining || 'kaldı'}` : ''}</span>
              </div>
            </div>

            {/* Warning if over 80% */}
            {progress >= 80 && !isOverBudget && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-xl flex items-center gap-2"
              >
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="text-sm">{t.budgetWarning || 'Bütçe limitine yaklaşıyorsunuz!'}</span>
              </motion.div>
            )}

            {isOverBudget && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2"
              >
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-sm">{t.budgetExceeded || 'Bütçe limiti aşıldı!'}</span>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="widget">
          <p className="text-xs text-muted-foreground">{t.remainingBudget || 'Kalan Bütçe'}</p>
          {remaining <= 0 ? (
            <p className="text-lg font-bold text-destructive">
              {t.noBudgetLeft || '0 TL kaldı'}
            </p>
          ) : (
            <p className={`text-xl font-bold text-success`}>
              ₺{remaining.toLocaleString()}
            </p>
          )}
        </div>
        <div className="widget">
          <p className="text-xs text-muted-foreground">{t.dailyBudget || 'Günlük Bütçe'}</p>
          {dailyBudget <= 0 || isOverBudget ? (
            <>
              <p className="text-lg font-bold text-destructive">
                {t.noDailyBudgetLeft || '0 TL kaldı'}
              </p>
              {daysRemaining > 0 && (
                <p className="text-xs text-muted-foreground">{daysRemaining} {t.daysLeft || 'gün kaldı'}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-primary">
                ₺{dailyBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">{daysRemaining} {t.daysLeft || 'gün kaldı'}</p>
            </>
          )}
        </div>
      </div>

      {/* This Month Summary */}
      <div className="widget">
        <h3 className="font-semibold mb-3">{t.thisMonthSummary || 'Bu Ay Özeti'}</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t.totalIncome || 'Toplam Gelir'}</span>
            <span className="font-semibold text-success">+₺{thisMonthIncome.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t.totalExpense || 'Toplam Gider'}</span>
            <span className="font-semibold text-destructive">-₺{thisMonthExpenses.toLocaleString()}</span>
          </div>
          <div className="border-t border-muted pt-3 flex justify-between items-center">
            <span className="font-medium">{t.netBalance || 'Net'}</span>
            <span className={`font-bold ${thisMonthIncome - thisMonthExpenses >= 0 ? 'text-success' : 'text-destructive'}`}>
              {thisMonthIncome - thisMonthExpenses >= 0 ? '+' : ''}₺{(thisMonthIncome - thisMonthExpenses).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Expenses by Category */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="widget">
          <h3 className="font-semibold mb-3">{t.expensesByCategory || 'Kategoriye Göre'}</h3>
          <div className="space-y-3">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = budgetGoal ? (amount / budgetGoal) * 100 : 0;
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t.categories?.[category as keyof typeof t.categories] || category}</span>
                      <span>₺{amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        className={`h-full ${categoryColors[category] || 'bg-primary'} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </motion.div>
  );
};