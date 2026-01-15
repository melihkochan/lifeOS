import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const Stopwatch = () => {
  const { t } = useTranslation();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      centiseconds: centiseconds.toString().padStart(2, '0'),
    };
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    setLaps([time, ...laps]);
  };

  const { minutes, seconds, centiseconds } = formatTime(time);

  return (
    <div className="widget">
      {/* Display */}
      <div className="text-center py-8">
        <div className="font-mono text-5xl font-bold">
          <span className="text-gradient-primary">{minutes}</span>
          <span className="text-muted-foreground">:</span>
          <span className="text-gradient-primary">{seconds}</span>
          <span className="text-muted-foreground">.</span>
          <span className="text-muted-foreground text-3xl">{centiseconds}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleReset}
          className="btn-glass w-14 h-14 rounded-full flex items-center justify-center"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleStartStop}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isRunning ? 'bg-destructive' : 'bg-primary'
          }`}
        >
          {isRunning ? (
            <Pause className="w-6 h-6 text-destructive-foreground" />
          ) : (
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLap}
          disabled={!isRunning}
          className="btn-glass w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-50"
        >
          <Flag className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="border-t border-white/10 pt-4 max-h-48 overflow-auto">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{t.laps}</h3>
          <div className="space-y-2">
            {laps.map((lap, index) => {
              const lapTime = formatTime(lap);
              const lapNumber = laps.length - index;
              return (
                <div
                  key={index}
                  className="flex justify-between text-sm py-2 border-b border-white/5"
                >
                  <span className="text-muted-foreground">{t.lap} {lapNumber}</span>
                  <span className="font-mono">
                    {lapTime.minutes}:{lapTime.seconds}.{lapTime.centiseconds}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
