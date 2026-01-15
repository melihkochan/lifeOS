import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, Settings, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

type TimerMode = 'work' | 'break' | 'longBreak';

export const PomodoroTimer = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(4);
  
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getDuration = (m: TimerMode) => {
    switch (m) {
      case 'work': return workDuration * 60;
      case 'break': return breakDuration * 60;
      case 'longBreak': return longBreakDuration * 60;
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (mode === 'work') {
      const newSessions = completedSessions + 1;
      setCompletedSessions(newSessions);
      
      if (newSessions % sessionsUntilLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(longBreakDuration * 60);
        toast.success(t.longBreakTime || 'Uzun mola zamanı! 🎉');
      } else {
        setMode('break');
        setTimeLeft(breakDuration * 60);
        toast.success(t.breakTime || 'Mola zamanı! ☕');
      }
    } else {
      setMode('work');
      setTimeLeft(workDuration * 60);
      toast.success(t.workTime || 'Çalışma zamanı! 💪');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / getDuration(mode);
  const circumference = 2 * Math.PI * 120;

  const getModeColor = () => {
    switch (mode) {
      case 'work': return 'text-primary';
      case 'break': return 'text-success';
      case 'longBreak': return 'text-secondary';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'work': return <Brain className="w-6 h-6" />;
      case 'break': return <Coffee className="w-6 h-6" />;
      case 'longBreak': return <Coffee className="w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-primary text-sm mb-2 hover:underline">
            ← {t.back}
          </button>
          <h1 className="text-2xl font-bold">{t.pomodoro || 'Pomodoro'}</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-xl bg-muted"
        >
          <Settings className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-2">
        {(['work', 'break', 'longBreak'] as TimerMode[]).map((m) => (
          <motion.button
            key={m}
            whileTap={{ scale: 0.95 }}
            onClick={() => switchMode(m)}
            className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
              mode === m ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            {m === 'work' ? (t.work || 'Çalışma') : m === 'break' ? (t.shortBreak || 'Kısa Mola') : (t.longBreakLabel || 'Uzun Mola')}
          </motion.button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="flex justify-center py-6">
        <div className="relative">
          <svg width="280" height="280" className="transform -rotate-90">
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={getModeColor()}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              initial={false}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`mb-2 ${getModeColor()}`}>
              {getModeIcon()}
            </div>
            <span className="text-5xl font-bold font-mono">{formatTime(timeLeft)}</span>
            <span className="text-sm text-muted-foreground mt-2">
              {mode === 'work' ? (t.focusMode || 'Odaklanma') : (t.restMode || 'Dinlenme')}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={resetTimer}
          className="p-4 rounded-full bg-muted"
        >
          <RotateCcw className="w-6 h-6" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTimer}
          className={`p-6 rounded-full ${isRunning ? 'bg-destructive' : 'bg-primary'} text-primary-foreground`}
        >
          {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </motion.button>
      </div>

      {/* Session Counter */}
      <div className="widget text-center">
        <p className="text-sm text-muted-foreground">{t.completedSessions || 'Tamamlanan Oturumlar'}</p>
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: sessionsUntilLongBreak }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < (completedSessions % sessionsUntilLongBreak) || (completedSessions > 0 && completedSessions % sessionsUntilLongBreak === 0 && i < sessionsUntilLongBreak)
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-2xl font-bold mt-2">{completedSessions}</p>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background rounded-2xl p-6 w-full max-w-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t.timerSettings || 'Zamanlayıcı Ayarları'}</h3>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">{t.workDuration || 'Çalışma Süresi (dk)'}</label>
                <input
                  type="number"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(Number(e.target.value))}
                  className="input-glass w-full mt-1"
                  min={1}
                  max={60}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t.breakDurationLabel || 'Kısa Mola (dk)'}</label>
                <input
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                  className="input-glass w-full mt-1"
                  min={1}
                  max={30}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t.longBreakDuration || 'Uzun Mola (dk)'}</label>
                <input
                  type="number"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                  className="input-glass w-full mt-1"
                  min={1}
                  max={60}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t.sessionsUntilLongBreak || 'Uzun Molaya Kadar Oturum'}</label>
                <input
                  type="number"
                  value={sessionsUntilLongBreak}
                  onChange={(e) => setSessionsUntilLongBreak(Number(e.target.value))}
                  className="input-glass w-full mt-1"
                  min={2}
                  max={10}
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setTimeLeft(getDuration(mode));
                setShowSettings(false);
                toast.success(t.settingsSaved || 'Ayarlar kaydedildi');
              }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
            >
              {t.save || 'Kaydet'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};