import { motion } from 'framer-motion';
import { Home, CheckSquare, Wallet, FileText, BarChart3, Settings } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { id: 'home', icon: Home, label: t.nav.home },
    { id: 'tasks', icon: CheckSquare, label: t.nav.tasks },
    { id: 'notes', icon: FileText, label: t.nav.notes },
    { id: 'wallet', icon: Wallet, label: t.nav.wallet },
    { id: 'analytics', icon: BarChart3, label: t.nav.analytics },
    { id: 'settings', icon: Settings, label: t.nav.settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-3 pt-2">
      <motion.div
        initial={mounted ? false : { y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-card flex items-center justify-around py-1.5 px-1 mx-auto max-w-md"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item relative ${isActive ? 'active' : ''}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className={`w-4 h-4 relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[8px] font-medium relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
            </button>
          );
        })}
      </motion.div>
    </nav>
  );
};