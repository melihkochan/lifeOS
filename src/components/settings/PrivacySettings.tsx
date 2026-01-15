import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { Shield, Lock, Eye, EyeOff, Fingerprint, Download, Trash2, Upload } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

interface PrivacyPrefs {
  lockEnabled: boolean;
  hideBalances: boolean;
  hideAmounts: boolean;
}

export const PrivacySettings = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const { importData, language } = useAppStore();
  const { syncSettings } = useSupabaseData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prefs, setPrefs] = useState<PrivacyPrefs>(() => {
    const saved = localStorage.getItem('lifeOS-privacy');
    return saved ? JSON.parse(saved) : {
      lockEnabled: false,
      hideBalances: false,
      hideAmounts: false,
    };
  });

  const savePrefs = async (newPrefs: PrivacyPrefs) => {
    setPrefs(newPrefs);
    localStorage.setItem('lifeOS-privacy', JSON.stringify(newPrefs));
    
    // Sync privacy settings to database (hideBalances, hideAmounts, and lockEnabled)
    if (newPrefs.hideBalances !== undefined || newPrefs.hideAmounts !== undefined || newPrefs.lockEnabled !== undefined) {
      try {
        await syncSettings();
      } catch (error) {
        console.error('Error syncing privacy settings:', error);
      }
    }
    
    toast.success(t.settingsSaved);
  };

  const exportData = () => {
    const data = {
      profile: localStorage.getItem('lifeOS-profile'),
      storage: localStorage.getItem('lifeOS-storage'),
      notifications: localStorage.getItem('lifeOS-notifications'),
      privacy: localStorage.getItem('lifeOS-privacy'),
      appearance: localStorage.getItem('lifeOS-appearance'),
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeOS-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.dataExported);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const data = JSON.parse(content);
        
        // Restore all localStorage items
        if (data.profile) localStorage.setItem('lifeOS-profile', data.profile);
        if (data.notifications) localStorage.setItem('lifeOS-notifications', data.notifications);
        if (data.privacy) localStorage.setItem('lifeOS-privacy', data.privacy);
        if (data.appearance) localStorage.setItem('lifeOS-appearance', data.appearance);
        
        // Import main data through store
        if (importData(content)) {
          toast.success(language === 'tr' ? 'Veriler başarıyla içe aktarıldı!' : 'Data imported successfully!');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error(language === 'tr' ? 'Geçersiz yedek dosyası' : 'Invalid backup file');
        }
      } catch {
        toast.error(language === 'tr' ? 'Dosya okunamadı' : 'Could not read file');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        <h1 className="text-2xl font-bold">{t.privacy}</h1>
        <p className="text-muted-foreground text-sm">{t.privacyDesc}</p>
      </div>

      {/* Security */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground px-1">{t.security}</h3>
        
        <div className="widget flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fingerprint className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">{t.appLock}</p>
              <p className="text-xs text-muted-foreground">{t.appLockDesc}</p>
            </div>
          </div>
          <ToggleButton
            enabled={prefs.lockEnabled}
            onToggle={() => savePrefs({ ...prefs, lockEnabled: !prefs.lockEnabled })}
          />
        </div>
      </div>

      {/* Display */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground px-1">{t.display}</h3>
        
        <div className="widget flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EyeOff className="w-5 h-5 text-warning" />
            <div>
              <p className="font-medium">{t.hideBalances}</p>
              <p className="text-xs text-muted-foreground">{t.hideBalancesDesc}</p>
            </div>
          </div>
          <ToggleButton
            enabled={prefs.hideBalances}
            onToggle={() => savePrefs({ ...prefs, hideBalances: !prefs.hideBalances })}
          />
        </div>

        <div className="widget flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{t.hideAmounts}</p>
              <p className="text-xs text-muted-foreground">{t.hideAmountsDesc}</p>
            </div>
          </div>
          <ToggleButton
            enabled={prefs.hideAmounts}
            onToggle={() => savePrefs({ ...prefs, hideAmounts: !prefs.hideAmounts })}
          />
        </div>
      </div>

      {/* Data Management */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground px-1">{t.dataManagement}</h3>
        
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={exportData}
          className="widget w-full flex items-center gap-3"
        >
          <Download className="w-5 h-5 text-success" />
          <div className="flex-1 text-left">
            <p className="font-medium">{t.exportData}</p>
            <p className="text-xs text-muted-foreground">{t.exportDataDesc}</p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="widget w-full flex items-center gap-3"
        >
          <Upload className="w-5 h-5 text-primary" />
          <div className="flex-1 text-left">
            <p className="font-medium">{language === 'tr' ? 'Verileri İçe Aktar' : 'Import Data'}</p>
            <p className="text-xs text-muted-foreground">{language === 'tr' ? 'JSON yedek dosyasından geri yükle' : 'Restore from JSON backup file'}</p>
          </div>
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (window.confirm(t.confirmDelete)) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="widget w-full flex items-center gap-3 border border-destructive/30"
        >
          <Trash2 className="w-5 h-5 text-destructive" />
          <div className="flex-1 text-left">
            <p className="font-medium text-destructive">{t.deleteAllData}</p>
            <p className="text-xs text-muted-foreground">{t.deleteAllDataDesc}</p>
          </div>
        </motion.button>
      </div>

      {/* Info */}
      <div className="widget bg-primary/5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">{t.dataStoredLocally}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.dataStoredLocallyDesc}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
