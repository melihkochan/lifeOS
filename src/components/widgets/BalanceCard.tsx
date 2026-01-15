import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';

export const BalanceCard = () => {
  const { balance, transactions, activeTab } = useAppStore();
  const { t } = useTranslation();
  
  // Check privacy settings for initial state
  const getPrivacyPrefs = () => {
    const saved = localStorage.getItem('lifeOS-privacy');
    return saved ? JSON.parse(saved) : { hideBalances: false, hideAmounts: false };
  };
  
  const [showBalance, setShowBalance] = useState(() => !getPrivacyPrefs().hideBalances);
  const userToggledRef = useRef(false);
  const previousTabRef = useRef(activeTab);
  const isHomeTabRef = useRef(activeTab === 'home');
  
  // Reset when user navigates away from home tab and comes back
  useEffect(() => {
    const wasHome = isHomeTabRef.current;
    const isHome = activeTab === 'home';
    
    if (wasHome && !isHome) {
      // User left home tab, mark that we should reset when they come back
      userToggledRef.current = false;
    } else if (!wasHome && isHome) {
      // User came back to home tab, reset to privacy setting
      const prefs = getPrivacyPrefs();
      setShowBalance(!prefs.hideBalances);
      userToggledRef.current = false;
    }
    
    isHomeTabRef.current = isHome;
    previousTabRef.current = activeTab;
  }, [activeTab]);
  
  // Listen for privacy setting changes (only if user hasn't manually toggled)
  useEffect(() => {
    const handleStorageChange = () => {
      if (!userToggledRef.current) {
        const prefs = getPrivacyPrefs();
        setShowBalance(!prefs.hideBalances);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const now = new Date();
  const thisMonthTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.createdAt);
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = thisMonthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthlyExpense = thisMonthTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
      className="widget-animated relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">{t.currentBalance}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowBalance(!showBalance);
              userToggledRef.current = true;
            }}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {showBalance ? (
              <Eye className="w-4 h-4 text-muted-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </motion.button>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
            {showBalance ? (
              <>₺{Math.abs(balance).toLocaleString()}{balance < 0 && ' -'}</>
            ) : (
              '₺•••••'
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-success/10">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.income}</p>
              <p className="font-semibold text-success">
                {showBalance ? `+₺${monthlyIncome.toLocaleString()}` : '+₺•••'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-destructive/10">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.expense}</p>
              <p className="font-semibold text-destructive">
                {showBalance ? `-₺${monthlyExpense.toLocaleString()}` : '-₺•••'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};