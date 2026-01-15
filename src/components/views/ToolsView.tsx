import { motion } from 'framer-motion';
import { useState } from 'react';
import { Calculator as CalcIcon, Timer, MapPin, ArrowRightLeft, Key, Shuffle, Clock, Link } from 'lucide-react';
import { Calculator } from '../tools/Calculator';
import { Stopwatch } from '../tools/Stopwatch';
import { LocationTracker } from '../tools/LocationTracker';
import { UnitConverter } from '../tools/UnitConverter';
import { PasswordGenerator } from '../tools/PasswordGenerator';
import { RandomPicker } from '../tools/RandomPicker';
import { PomodoroTimer } from '../tools/PomodoroTimer';
import { QRGenerator } from '../tools/QRGenerator';
import { useTranslation } from '@/hooks/useTranslation';

interface ToolsViewProps {
  initialTool?: string;
}

export const ToolsView = ({ initialTool }: ToolsViewProps) => {
  const { t } = useTranslation();
  
  // Check for tool selected from home page FAB
  const storedTool = typeof window !== 'undefined' ? sessionStorage.getItem('selectedTool') : null;
  const [activeTool, setActiveTool] = useState<string | null>(initialTool || storedTool || null);
  
  // Clear the stored tool after using it
  if (storedTool) {
    sessionStorage.removeItem('selectedTool');
  }

  const tools = [
    { id: 'calculator', icon: CalcIcon, label: t.calculator, color: 'text-primary' },
    { id: 'stopwatch', icon: Timer, label: t.stopwatch, color: 'text-secondary' },
    { id: 'pomodoro', icon: Clock, label: t.pomodoro || 'Pomodoro', color: 'text-warning' },
    { id: 'location', icon: MapPin, label: t.location, color: 'text-secondary' },
    { id: 'converter', icon: ArrowRightLeft, label: t.converter, color: 'text-warning' },
    { id: 'password', icon: Key, label: t.password, color: 'text-destructive' },
    { id: 'random', icon: Shuffle, label: t.random, color: 'text-success' },
    { id: 'qr', icon: Link, label: t.qrGenerator, color: 'text-primary' },
  ];

  const renderTool = () => {
    switch (activeTool) {
      case 'calculator':
        return <Calculator />;
      case 'stopwatch':
        return <Stopwatch />;
      case 'pomodoro':
        return <PomodoroTimer onBack={() => setActiveTool(null)} />;
      case 'location':
        return <LocationTracker />;
      case 'converter':
        return <UnitConverter />;
      case 'password':
        return <PasswordGenerator />;
      case 'random':
        return <RandomPicker />;
      case 'qr':
        return <QRGenerator />;
      default:
        return null;
    }
  };

  const needsBackButton = !['pomodoro'].includes(activeTool || '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold mb-1">{t.tools}</h1>
        <p className="text-muted-foreground text-sm">{t.miniApps}</p>
      </div>

      {!activeTool ? (
        <div className="grid grid-cols-3 gap-3">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTool(tool.id)}
                className="widget flex flex-col items-center gap-2 py-4"
              >
                <div className={`p-2.5 rounded-xl bg-muted ${tool.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-xs">{tool.label}</span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {needsBackButton && (
            <button
              onClick={() => setActiveTool(null)}
              className="text-primary text-sm mb-4 hover:underline"
            >
              ← {t.back}
            </button>
          )}
          {renderTool()}
        </motion.div>
      )}
    </motion.div>
  );
};