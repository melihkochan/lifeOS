import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { HomeView } from '@/components/views/HomeView';
import { TasksView } from '@/components/views/TasksView';
import { NotesView } from '@/components/views/NotesView';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { ToolsView } from '@/components/views/ToolsView';
import { WalletView } from '@/components/views/WalletView';
import { SettingsView } from '@/components/views/SettingsView';
import { useAppStore } from '@/stores/useAppStore';
import { useNotifications } from '@/hooks/useNotifications';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useBiometric } from '@/hooks/useBiometric';
import { useTranslation } from '@/hooks/useTranslation';

const Index = () => {
  const { activeTab } = useAppStore();
  const { t, language } = useTranslation();
  const [biometricChecked, setBiometricChecked] = useState(false);
  
  // Initialize notifications system
  useNotifications();
  
  // Initialize Supabase data sync
  const { loadData } = useSupabaseData();
  
  // Biometric authentication
  const { isSupported, isAuthenticated, isChecking, checkBiometricLock } = useBiometric();
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply appearance settings on mount and when they change
  useEffect(() => {
    const applyAppearanceSettings = () => {
      const appearancePrefs = JSON.parse(localStorage.getItem('lifeOS-appearance') || '{}');
      
      // Apply theme
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = appearancePrefs.theme || 'dark';
      const isDark = theme === 'dark' || (theme === 'system' && systemDark);
      
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(isDark ? 'dark' : 'light');
      
      // Apply accent color
      const accentColor = appearancePrefs.accentColor || 'hsl(186 100% 50%)';
      const accentHsl = accentColor.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
      if (accentHsl) {
        document.documentElement.style.setProperty('--primary', `${accentHsl[1]} ${accentHsl[2]}% ${accentHsl[3]}%`);
      }
      
      // Apply font size
      const fontSize = appearancePrefs.fontSize || 'small';
      const fontSizes = { small: '14px', medium: '16px', large: '18px' };
      document.documentElement.style.setProperty('--base-font-size', fontSizes[fontSize as keyof typeof fontSizes]);
      document.body.style.fontSize = fontSizes[fontSize as keyof typeof fontSizes];
      
      // Apply compact mode
      const compactMode = appearancePrefs.compactMode !== undefined ? appearancePrefs.compactMode : true;
      document.documentElement.classList.toggle('compact-mode', compactMode);
    };

    // Apply on mount
    applyAppearanceSettings();

    // Listen for storage changes (when settings are updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lifeOS-appearance') {
        applyAppearanceSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event (for same-tab updates)
    const handleCustomStorageChange = () => {
      applyAppearanceSettings();
    };
    
    window.addEventListener('appearance-settings-changed', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('appearance-settings-changed', handleCustomStorageChange);
    };
  }, []);

  // Check biometric lock on mount
  useEffect(() => {
    const checkLock = async () => {
      // Check localStorage for biometric lock setting (loadData syncs DB to localStorage)
      const privacyPrefs = JSON.parse(localStorage.getItem('lifeOS-privacy') || '{}');
      const lockEnabled = privacyPrefs.lockEnabled ?? false;
      
      if (lockEnabled) {
        const authenticated = await checkBiometricLock();
        // Small delay to prevent animation glitches when unlocking
        setTimeout(() => {
          setBiometricChecked(true);
        }, 100);
        if (!authenticated) {
          // If authentication failed, keep showing lock screen
          return;
        }
      } else {
        // Lock is disabled, allow access immediately
        setBiometricChecked(true);
      }
    };

    // Wait a bit for loadData to complete, then check lock
    const timer = setTimeout(() => {
      checkLock();
    }, 100);

    return () => clearTimeout(timer);
  }, [checkBiometricLock]);

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'tasks':
        return <TasksView />;
      case 'notes':
        return <NotesView />;
      case 'wallet':
        return <WalletView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'tools':
        return <ToolsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView />;
    }
  };

  // Check if biometric lock is enabled
  const privacyPrefs = JSON.parse(localStorage.getItem('lifeOS-privacy') || '{}');
  const lockEnabled = privacyPrefs.lockEnabled ?? false;

  // Show biometric lock screen only if lock is enabled and not checked yet
  if (lockEnabled && !biometricChecked) {
    // Show loading screen while checking
    if (isChecking) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 px-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Fingerprint className="w-10 h-10 text-primary" />
              </div>
            </motion.div>
            <div>
              <h2 className="text-xl font-bold mb-2">
                {language === 'tr' ? 'Uygulama Kilitli' : 'App Locked'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'tr' 
                  ? 'Biyometrik kimlik doğrulama bekleniyor...' 
                  : 'Waiting for biometric authentication...'}
              </p>
            </div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-sm text-muted-foreground"
            >
              {language === 'tr' ? 'Kimlik doğrulanıyor...' : 'Authenticating...'}
            </motion.div>
          </motion.div>
        </div>
      );
    }

    // Show authentication required screen if not authenticated
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 px-6"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">
                {language === 'tr' ? 'Kimlik Doğrulama Gerekli' : 'Authentication Required'}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {language === 'tr' 
                  ? 'Uygulamaya erişmek için biyometrik kimlik doğrulama gerekli.' 
                  : 'Biometric authentication is required to access the app.'}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  const authenticated = await checkBiometricLock();
                  if (authenticated) {
                    setBiometricChecked(true);
                  }
                }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
              >
                {language === 'tr' ? 'Tekrar Dene' : 'Try Again'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 pt-6">
        <AnimatePresence mode="wait" initial={false}>
          {renderView()}
        </AnimatePresence>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Index;
