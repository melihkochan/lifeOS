import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Palette, Sun, Moon, Monitor, Type, Maximize, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface AppearancePrefs {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

const accentColors = [
  { name: 'Cyan', value: 'hsl(186 100% 50%)' },
  { name: 'Purple', value: 'hsl(270 100% 60%)' },
  { name: 'Pink', value: 'hsl(330 100% 60%)' },
  { name: 'Orange', value: 'hsl(25 100% 55%)' },
  { name: 'Green', value: 'hsl(150 100% 45%)' },
  { name: 'Blue', value: 'hsl(210 100% 55%)' },
];

export const AppearanceSettings = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const { syncSettings } = useSupabaseData();
  const [prefs, setPrefs] = useState<AppearancePrefs>(() => {
    const saved = localStorage.getItem('lifeOS-appearance');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      accentColor: accentColors[0].value,
      fontSize: 'small',
      compactMode: true,
    };
  });

  useEffect(() => {
    // Apply theme
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark);
    
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(isDark ? 'dark' : 'light');
    
    // Apply accent color to CSS variables
    const accentHsl = prefs.accentColor.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (accentHsl) {
      document.documentElement.style.setProperty('--primary', `${accentHsl[1]} ${accentHsl[2]}% ${accentHsl[3]}%`);
    }
    
    // Apply font size
    const fontSizes = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.setProperty('--base-font-size', fontSizes[prefs.fontSize]);
    document.body.style.fontSize = fontSizes[prefs.fontSize];
    
    // Apply compact mode
    document.documentElement.classList.toggle('compact-mode', prefs.compactMode);
  }, [prefs]);

  const savePrefs = async (newPrefs: AppearancePrefs) => {
    setPrefs(newPrefs);
    localStorage.setItem('lifeOS-appearance', JSON.stringify(newPrefs));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('appearance-settings-changed'));
    
    // Sync appearance settings to database
    try {
      await syncSettings();
      toast.success(t.settingsSaved);
    } catch (error) {
      console.error('Error syncing appearance settings:', error);
      toast.error('Ayarlar kaydedilirken hata oluştu');
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
        <h1 className="text-2xl font-bold">{t.appearance}</h1>
        <p className="text-muted-foreground text-sm">{t.appearanceDesc}</p>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground px-1">{t.theme}</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'light', icon: Sun, label: t.light },
            { value: 'dark', icon: Moon, label: t.dark },
            { value: 'system', icon: Monitor, label: t.system },
          ].map((theme) => (
            <motion.button
              key={theme.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => savePrefs({ ...prefs, theme: theme.value as AppearancePrefs['theme'] })}
              className={`py-4 rounded-xl flex flex-col items-center gap-2 ${
                prefs.theme === theme.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <theme.icon className="w-6 h-6" />
              <span className="text-sm">{theme.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="widget">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-medium">{t.accentColor}</h3>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {accentColors.map((color) => (
            <motion.button
              key={color.name}
              whileTap={{ scale: 0.9 }}
              onClick={() => savePrefs({ ...prefs, accentColor: color.value })}
              className="relative w-10 h-10 rounded-full"
              style={{ backgroundColor: color.value }}
            >
              {prefs.accentColor === color.value && (
                <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="widget">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-primary" />
          <h3 className="font-medium">{t.fontSize}</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'small', label: t.small },
            { value: 'medium', label: t.medium },
            { value: 'large', label: t.large },
          ].map((size) => (
            <motion.button
              key={size.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => savePrefs({ ...prefs, fontSize: size.value as AppearancePrefs['fontSize'] })}
              className={`py-3 rounded-xl ${
                prefs.fontSize === size.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {size.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Compact Mode */}
      <div className="widget flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Maximize className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{t.compactMode}</p>
            <p className="text-xs text-muted-foreground">{t.compactModeDesc}</p>
          </div>
        </div>
        <ToggleButton
          enabled={prefs.compactMode}
          onToggle={() => savePrefs({ ...prefs, compactMode: !prefs.compactMode })}
        />
      </div>
    </motion.div>
  );
};
