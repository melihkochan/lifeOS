import { motion } from 'framer-motion';
import { useState } from 'react';
import { WalletTool } from '../tools/WalletTool';
import { BudgetGoal } from '../tools/BudgetGoal';
import { useTranslation } from '@/hooks/useTranslation';

export const WalletView = () => {
  const { t } = useTranslation();
  const [showBudgetDetail, setShowBudgetDetail] = useState(false);

  if (showBudgetDetail) {
    return <BudgetGoal onBack={() => setShowBudgetDetail(false)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-2xl font-bold mb-1">{t.wallet}</h1>
        <p className="text-muted-foreground text-sm">{t.financialOverview}</p>
      </div>

      <WalletTool onOpenBudget={() => setShowBudgetDetail(true)} />
    </motion.div>
  );
};
