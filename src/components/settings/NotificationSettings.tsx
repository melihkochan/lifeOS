import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Calendar, Wallet, Volume2, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

// Try to import Capacitor App (for mobile)
let CapacitorApp: any = null;
let Capacitor: any = null;
try {
  const capacitorCore = require('@capacitor/core');
  Capacitor = capacitorCore.Capacitor;
  const appModule = require('@capacitor/app');
  CapacitorApp = appModule.App;
} catch (e) {
  // Not in mobile environment
}

interface NotificationPrefs {
  taskReminders: boolean;
  noteReminders: boolean;
  financialAlerts: boolean;
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export const NotificationSettings = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const { language } = useAppStore();
  const { syncSettings } = useSupabaseData();
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => {
    const saved = localStorage.getItem('lifeOS-notifications');
    return saved ? JSON.parse(saved) : {
      taskReminders: true,
      noteReminders: true,
      financialAlerts: true,
      soundEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    };
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error(language === 'tr' ? 'Tarayıcınız bildirimleri desteklemiyor' : 'Your browser does not support notifications');
      return;
    }

    // Check if permission was previously denied/blocked
    if (Notification.permission === 'denied') {
      toast.error(language === 'tr' 
        ? 'Bildirim izni tarayıcı tarafından engellenmiş. Lütfen tarayıcı ayarlarından izin verin.' 
        : 'Notification permission is blocked. Please enable it in browser settings.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        toast.success(t.notificationsEnabled);
      } else if (permission === 'denied') {
        toast.error(language === 'tr' 
          ? 'Bildirim izni reddedildi. Tarayıcı ayarlarından etkinleştirebilirsiniz.' 
          : 'Notification permission denied. You can enable it in browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error(language === 'tr' 
        ? 'Bildirim izni alınırken hata oluştu' 
        : 'Error requesting notification permission');
    }
  };

  const savePrefs = async (newPrefs: NotificationPrefs) => {
    setPrefs(newPrefs);
    localStorage.setItem('lifeOS-notifications', JSON.stringify(newPrefs));
    
    // Sync quiet hours to database
    if (newPrefs.quietHoursEnabled !== undefined || newPrefs.quietHoursStart || newPrefs.quietHoursEnd) {
      try {
        await syncSettings();
      } catch (error) {
        console.error('Error syncing quiet hours:', error);
      }
    }
    
    toast.success(t.settingsSaved);
  };

  const ToggleButton = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
        enabled ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="w-4 h-4 bg-white rounded-full"
      />
    </button>
  );

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
        <h1 className="text-2xl font-bold">{t.notifications}</h1>
        <p className="text-muted-foreground text-sm">{t.notificationsDesc}</p>
      </div>

      {/* Permission Status */}
      <div className={`widget ${permissionStatus === 'granted' ? 'border-success/30' : 'border-warning/30'} border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permissionStatus === 'granted' ? (
              <Bell className="w-5 h-5 text-success" />
            ) : (
              <BellOff className="w-5 h-5 text-warning" />
            )}
            <div>
              <p className="font-medium">{t.browserNotifications}</p>
              <p className="text-xs text-muted-foreground">
                {permissionStatus === 'granted' ? t.enabled : t.disabled}
              </p>
            </div>
          </div>
          {permissionStatus !== 'granted' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={requestPermission}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              {t.enable}
            </motion.button>
          )}
        </div>
      </div>

      {/* Mobile Optimizations - Arka Plan Verisi */}
      {Capacitor && Capacitor.getPlatform() === 'android' && (
        <div className="widget border border-info/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Settings className="w-5 h-5 text-info mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {language === 'tr' ? 'Arka Plan Bildirimleri' : 'Background Notifications'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'tr' 
                    ? 'Uygulama kapalıyken bildirimlerin gelmesi için pil optimizasyonunu kapatmanız gerekebilir.'
                    : 'You may need to disable battery optimization for notifications when the app is closed.'}
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                try {
                  if (CapacitorApp) {
                    // Open Android app settings directly
                    await CapacitorApp.openUrl({ url: 'app-settings:' });
                    toast.success(
                      language === 'tr' 
                        ? 'Ayarlar açılıyor... Pil > Optimizasyon yok seçeneğini kapatın'
                        : 'Opening settings... Turn off Battery optimization',
                      { duration: 5000 }
                    );
                  } else {
                    throw new Error('Capacitor App not available');
                  }
                } catch (error) {
                  // Fallback: Show detailed instructions
                  toast.info(
                    language === 'tr'
                      ? 'Ayarlar > Uygulamalar > LifeOS > Pil > Optimizasyon yok seçeneğini kapatın'
                      : 'Settings > Apps > LifeOS > Battery > Turn off optimization',
                    { 
                      duration: 10000,
                      description: language === 'tr' 
                        ? 'Bu ayarı kapatmak bildirimlerin arka planda çalışmasını sağlar'
                        : 'Disabling this allows notifications to work in background'
                    }
                  );
                }
              }}
              className="px-4 py-2 bg-info/10 text-info rounded-lg text-sm whitespace-nowrap hover:bg-info/20 transition-colors"
            >
              {language === 'tr' ? 'Ayarlara Git' : 'Open Settings'}
            </motion.button>
          </div>
        </div>
      )}

      {/* Notification Types */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground px-1">{t.notificationTypes}</h3>
        
        <div className="widget flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">{t.taskReminders}</p>
              <p className="text-xs text-muted-foreground">{t.taskRemindersDesc}</p>
            </div>
          </div>
          <ToggleButton
            enabled={prefs.taskReminders}
            onToggle={() => savePrefs({ ...prefs, taskReminders: !prefs.taskReminders })}
          />
        </div>

        <div className="widget flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-secondary" />
            <div>
              <p className="font-medium">{t.noteReminders}</p>
              <p className="text-xs text-muted-foreground">{t.noteRemindersDesc}</p>
            </div>
          </div>
          <ToggleButton
            enabled={prefs.noteReminders}
            onToggle={() => savePrefs({ ...prefs, noteReminders: !prefs.noteReminders })}
          />
        </div>

        <div className="widget flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-warning" />
            <div>
              <p className="font-medium">{t.financialAlerts}</p>
              <p className="text-xs text-muted-foreground">{t.financialAlertsDesc}</p>
            </div>
          </div>
          <ToggleButton
            enabled={prefs.financialAlerts}
            onToggle={() => savePrefs({ ...prefs, financialAlerts: !prefs.financialAlerts })}
          />
        </div>
      </div>

      {/* Sound */}
      <div className="widget flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{t.notificationSound}</p>
            <p className="text-xs text-muted-foreground">{t.notificationSoundDesc}</p>
          </div>
        </div>
        <ToggleButton
          enabled={prefs.soundEnabled}
          onToggle={() => savePrefs({ ...prefs, soundEnabled: !prefs.soundEnabled })}
        />
      </div>

      {/* Quiet Hours */}
      <div className="widget">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{t.quietHours}</p>
              <p className="text-xs text-muted-foreground">{t.quietHoursDesc}</p>
            </div>
          </div>
          <ToggleButton
            enabled={prefs.quietHoursEnabled}
            onToggle={() => savePrefs({ ...prefs, quietHoursEnabled: !prefs.quietHoursEnabled })}
          />
        </div>

        {prefs.quietHoursEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-2 gap-4 pt-4 border-t border-border"
          >
            <div>
              <label className="text-xs text-muted-foreground">{t.from}</label>
              <input
                type="time"
                value={prefs.quietHoursStart}
                onChange={(e) => savePrefs({ ...prefs, quietHoursStart: e.target.value })}
                className="w-full mt-1 bg-muted rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t.to}</label>
              <input
                type="time"
                value={prefs.quietHoursEnd}
                onChange={(e) => savePrefs({ ...prefs, quietHoursEnd: e.target.value })}
                className="w-full mt-1 bg-muted rounded-lg px-3 py-2"
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
