import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Shuffle, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Plus, X, Sparkles, Coins, Circle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const DiceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export const RandomPicker = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'dice' | 'coin' | 'list'>('dice');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [coinValue, setCoinValue] = useState<'heads' | 'tails' | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const rollDice = () => {
    setIsAnimating(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 100);
  };

  const flipCoin = () => {
    setIsAnimating(true);
    let count = 0;
    const interval = setInterval(() => {
      setCoinValue(Math.random() > 0.5 ? 'heads' : 'tails');
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 100);
  };

  const pickRandom = () => {
    if (items.length === 0) return;
    setIsAnimating(true);
    let count = 0;
    const interval = setInterval(() => {
      setSelectedItem(items[Math.floor(Math.random() * items.length)]);
      count++;
      if (count >= 15) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 100);
  };

  const addItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (item: string) => {
    setItems(items.filter((i) => i !== item));
    if (selectedItem === item) setSelectedItem(null);
  };

  const DiceIcon = diceValue ? DiceIcons[diceValue - 1] : Dice1;

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setMode('dice')}
          className={`py-3 rounded-xl flex flex-col items-center gap-1 ${
            mode === 'dice' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <Dice6 className="w-5 h-5" />
          <span className="text-xs">{t.dice}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setMode('coin')}
          className={`py-3 rounded-xl flex flex-col items-center gap-1 ${
            mode === 'coin' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-xs">{t.coin}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setMode('list')}
          className={`py-3 rounded-xl flex flex-col items-center gap-1 ${
            mode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <Shuffle className="w-5 h-5" />
          <span className="text-xs">{t.randomPick}</span>
        </motion.button>
      </div>

      {/* Dice Mode */}
      {mode === 'dice' && (
        <div className="widget">
          <div className="flex flex-col items-center py-8">
            <motion.div
              animate={isAnimating ? { rotate: [0, 360], scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.1 }}
              className="mb-6"
            >
              <DiceIcon className="w-24 h-24 text-primary" />
            </motion.div>
            <p className="text-4xl font-bold mb-6">{diceValue || '-'}</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={rollDice}
              disabled={isAnimating}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50"
            >
              {t.rollDice}
            </motion.button>
          </div>
        </div>
      )}

      {/* Coin Mode */}
      {mode === 'coin' && (
        <div className="widget">
          <div className="flex flex-col items-center py-8">
            <motion.div
              animate={isAnimating ? { rotateY: [0, 1800] } : {}}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="mb-6 flex items-center justify-center"
            >
              {coinValue === 'heads' ? (
                <Coins className="w-24 h-24 text-primary" />
              ) : coinValue === 'tails' ? (
                <Circle className="w-24 h-24 text-warning fill-warning/20" strokeWidth={3} />
              ) : (
                <Coins className="w-24 h-24 text-muted-foreground" />
              )}
            </motion.div>
            <p className="text-2xl font-bold mb-6">
              {coinValue === 'heads' ? t.heads : coinValue === 'tails' ? t.tails : '-'}
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={flipCoin}
              disabled={isAnimating}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50"
            >
              {t.flipCoin}
            </motion.button>
          </div>
        </div>
      )}

      {/* List Mode */}
      {mode === 'list' && (
        <div className="space-y-4">
          <div className="widget">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
                placeholder={t.addOption}
                className="flex-1 bg-muted/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={addItem}
                className="p-3 bg-primary text-primary-foreground rounded-xl"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[60px]">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                      selectedItem === item && !isAnimating
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <span className="text-sm">{item}</span>
                    <button onClick={() => removeItem(item)} className="p-0.5 hover:bg-black/10 rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {selectedItem && !isAnimating && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="widget bg-primary/10 text-center py-6"
            >
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">{t.selected}</p>
              <p className="text-2xl font-bold text-primary">{selectedItem}</p>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={pickRandom}
            disabled={isAnimating || items.length === 0}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold disabled:opacity-50"
          >
            {t.pickRandom}
          </motion.button>
        </div>
      )}
    </div>
  );
};
