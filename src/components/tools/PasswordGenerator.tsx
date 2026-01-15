import { motion } from 'framer-motion';
import { useState } from 'react';
import { Key, Copy, RefreshCw, Check, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

export const PasswordGenerator = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  const generatePassword = () => {
    let chars = '';
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) chars += '0123456789';
    if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (!chars) {
      toast.error(t.selectOption);
      return;
    }
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const copyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      toast.success(t.copied);
    }
  };

  const getStrength = () => {
    if (!password) return { level: 0, label: '-', color: 'bg-muted' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 3) return { level: 1, label: t.weak, color: 'bg-destructive' };
    if (score < 5) return { level: 2, label: t.medium, color: 'bg-warning' };
    if (score < 7) return { level: 3, label: t.strong, color: 'bg-success' };
    return { level: 4, label: t.veryStrong, color: 'bg-primary' };
  };

  const strength = getStrength();

  return (
    <div className="space-y-4">
      <div className="widget">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{t.passwordGenerator}</h3>
        </div>

        {/* Password Display */}
        <div className="relative mb-4">
          <input
            type="text"
            value={password}
            readOnly
            placeholder={t.clickGenerate}
            className="w-full bg-muted/50 rounded-xl px-4 py-4 pr-24 font-mono text-lg focus:outline-none"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={copyPassword}
              disabled={!password}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={generatePassword}
              className="p-2 rounded-lg bg-primary text-primary-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Strength Indicator */}
        {password && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{t.strength}</span>
              <span className={strength.level >= 3 ? 'text-success' : strength.level >= 2 ? 'text-warning' : 'text-destructive'}>
                {strength.label}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    i <= strength.level ? strength.color : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Length Slider */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t.passwordLength}</span>
            <span className="font-medium">{length}</span>
          </div>
          <input
            type="range"
            min="8"
            max="32"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          {[
            { key: 'uppercase', label: t.uppercase },
            { key: 'lowercase', label: t.lowercase },
            { key: 'numbers', label: t.numbers },
            { key: 'symbols', label: t.symbols },
          ].map((option) => (
            <motion.button
              key={option.key}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOptions({ ...options, [option.key]: !options[option.key as keyof typeof options] })}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted/80"
            >
              <span className="text-sm">{option.label}</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                options[option.key as keyof typeof options] ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {options[option.key as keyof typeof options] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={generatePassword}
        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold"
      >
        {t.generatePassword}
      </motion.button>
    </div>
  );
};
