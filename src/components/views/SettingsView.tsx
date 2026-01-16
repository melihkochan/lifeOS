import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { User, Bell, Shield, Palette, HelpCircle, Info, ChevronRight, Trash2, Globe, Wallet, LogOut } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ProfileSettings } from '../settings/ProfileSettings';
import { NotificationSettings } from '../settings/NotificationSettings';
import { PrivacySettings } from '../settings/PrivacySettings';
import { AppearanceSettings } from '../settings/AppearanceSettings';
import { HelpSettings } from '../settings/HelpSettings';
import { AboutSettings } from '../settings/AboutSettings';

type SettingsScreen = 'main' | 'profile' | 'notifications' | 'privacy' | 'appearance' | 'help' | 'about';

export const SettingsView = () => {
  const { tasks, notes, transactions, balance, language, setLanguage, profile } = useAppStore();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [activeScreen, setActiveScreen] = useState<SettingsScreen>('main');

  const handleSignOut = async () => {
    await signOut();
    toast.success('Çıkış yapıldı');
  };

  const settingsItems = [
    { id: 'profile', icon: User, label: t.profile, description: t.profileDesc },
    { id: 'notifications', icon: Bell, label: t.notifications, description: t.notificationsDesc },
    { id: 'privacy', icon: Shield, label: t.privacy, description: t.privacyDesc },
    { id: 'appearance', icon: Palette, label: t.appearance, description: t.appearanceDesc },
    { id: 'help', icon: HelpCircle, label: t.help, description: t.helpDesc },
    { id: 'about', icon: Info, label: t.about, description: t.aboutDesc },
  ];

  const handleClearData = () => {
    if (window.confirm(t.confirmDelete)) {
      localStorage.removeItem('lifeOS-storage');
      window.location.reload();
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
    toast.success(language === 'tr' ? 'Language changed to English' : 'Dil Türkçe olarak değiştirildi');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'profile':
        return <ProfileSettings onBack={() => setActiveScreen('main')} />;
      case 'notifications':
        return <NotificationSettings onBack={() => setActiveScreen('main')} />;
      case 'privacy':
        return <PrivacySettings onBack={() => setActiveScreen('main')} />;
      case 'appearance':
        return <AppearanceSettings onBack={() => setActiveScreen('main')} />;
      case 'help':
        return <HelpSettings onBack={() => setActiveScreen('main')} />;
      case 'about':
        return <AboutSettings onBack={() => setActiveScreen('main')} />;
      default:
        return null;
    }
  };

  if (activeScreen !== 'main') {
    return (
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src="/lifOSlogo.png" 
              alt="LifeOS Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">{t.settings}</h1>
            <p className="text-muted-foreground text-sm">{t.managePrefs}</p>
          </div>
        </div>
      </div>

      {/* Profile Card with Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="widget"
      >
        <div className="flex items-center gap-4 mb-4">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name || 'Avatar'}
              className="w-14 h-14 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              {profile.name ? (
                <span className="text-xl font-bold text-primary-foreground">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-7 h-7 text-primary-foreground" />
              )}
            </div>
          )}
          <div className="flex-1">
            <h2 className="font-bold text-lg">{profile.name || t.user}</h2>
            <p className="text-muted-foreground text-sm">{profile.email || t.welcome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
          <Wallet className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">{t.currentBalance}:</span>
          <span className={`font-bold ml-auto ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
            {balance < 0 && '-'}₺{Math.abs(balance).toLocaleString()}
          </span>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="widget">
        <h3 className="font-medium mb-3">{t.yourData}</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{tasks.length}</p>
            <p className="text-xs text-muted-foreground">{t.task}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-secondary">{notes.length}</p>
            <p className="text-xs text-muted-foreground">{t.note}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{transactions.length}</p>
            <p className="text-xs text-muted-foreground">{t.transaction}</p>
          </div>
        </div>
      </div>

      {/* Language Toggle */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={toggleLanguage}
        className="widget w-full flex items-center gap-4"
      >
        <div className="p-2 rounded-xl bg-muted">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium">{t.language}</p>
          <p className="text-xs text-muted-foreground">{t.languageDesc}</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
          {language === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
        </div>
      </motion.button>

      {/* Settings List */}
      <div className="space-y-2">
        {settingsItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveScreen(item.id as SettingsScreen)}
              className="widget w-full flex items-center gap-4"
            >
              <div className="p-2 rounded-xl bg-muted">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          );
        })}
      </div>

      {/* Sign Out */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSignOut}
        className="widget w-full flex items-center gap-4 border border-warning/30"
      >
        <div className="p-2 rounded-xl bg-warning/10">
          <LogOut className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-warning">Çıkış Yap</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </motion.button>

      {/* Danger Zone */}
      <div className="widget border border-destructive/30">
        <h3 className="font-medium text-destructive mb-3">{t.dangerZone}</h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleClearData}
          className="w-full flex items-center justify-center gap-2 py-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          {t.deleteAllData}
        </motion.button>
      </div>

      {/* Version */}
      <div className="text-center text-muted-foreground text-sm py-4">
        <p>LifeOS v1.2.0</p>
        <p className="text-xs">{t.madeWith}.</p>
      </div>
    </motion.div>
  );
};
