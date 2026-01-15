import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Delete, RotateCcw } from 'lucide-react';

const buttons = [
  ['C', '⌫', '±', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '%'],
];

export const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // Format number with thousands separator
  const formatNumber = (value: string | number): string => {
    if (value === '0' || value === 0 || value === '') return '0';
    let num: number;
    if (typeof value === 'string') {
      // Remove formatting if present
      const cleaned = value.replace(/\./g, '').replace(',', '.');
      num = parseFloat(cleaned);
    } else {
      num = value;
    }
    if (isNaN(num)) return '0';
    // Format with Turkish locale (dot as thousands separator)
    return num.toLocaleString('tr-TR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 10,
      useGrouping: true
    });
  };

  // Parse formatted number back to numeric value
  const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      const currentRaw = display.replace(/\./g, '').replace(',', '.');
      const newValue = currentRaw === '0' ? num : currentRaw + num;
      setDisplay(newValue);
    }
  };

  const handleOperator = (op: string) => {
    const current = parseFormattedNumber(display);

    if (prevValue === null) {
      setPrevValue(current);
    } else if (operator) {
      const result = calculate(prevValue, current, operator);
      setDisplay(formatNumber(result));
      setPrevValue(result);
    }

    setOperator(op);
    setWaitingForOperand(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  };

  const handleEquals = () => {
    if (operator && prevValue !== null) {
      const current = parseFormattedNumber(display);
      const result = calculate(prevValue, current, operator);
      setDisplay(formatNumber(result));
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
    setWaitingForOperand(false);
  };

  const handlePercent = () => {
    const current = parseFormattedNumber(display);
    setDisplay(formatNumber(current / 100));
  };

  const handlePlusMinus = () => {
    const current = parseFormattedNumber(display);
    setDisplay(formatNumber(-current));
  };

  const handleButton = (btn: string) => {
    if (btn === 'C') handleClear();
    else if (btn === '⌫') handleDelete();
    else if (btn === '±') handlePlusMinus();
    else if (btn === '%') handlePercent();
    else if (btn === '=') handleEquals();
    else if (['+', '-', '×', '÷'].includes(btn)) handleOperator(btn);
    else handleNumber(btn);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;
      const currentDisplay = display;
      const currentPrevValue = prevValue;
      const currentOperator = operator;
      const currentWaitingForOperand = waitingForOperand;
      
      if (key >= '0' && key <= '9') {
        if (currentWaitingForOperand) {
          setDisplay(key);
          setWaitingForOperand(false);
        } else {
          setDisplay(currentDisplay === '0' ? key : currentDisplay + key);
        }
      } else if (key === '.') {
        const currentRaw = currentDisplay.replace(/\./g, '').replace(',', '.');
        if (currentWaitingForOperand) {
          setDisplay('0.');
          setWaitingForOperand(false);
        } else if (!currentRaw.includes('.')) {
          setDisplay(currentRaw + '.');
        }
      } else if (key === '+' || key === '-') {
        const current = parseFormattedNumber(currentDisplay);
        if (currentPrevValue === null) {
          setPrevValue(current);
        } else if (currentOperator) {
          const result = calculate(currentPrevValue, current, currentOperator);
          setDisplay(formatNumber(result));
          setPrevValue(result);
        }
        setOperator(key === '+' ? '+' : '-');
        setWaitingForOperand(true);
      } else if (key === '*') {
        const current = parseFormattedNumber(currentDisplay);
        if (currentPrevValue === null) {
          setPrevValue(current);
        } else if (currentOperator) {
          const result = calculate(currentPrevValue, current, currentOperator);
          setDisplay(formatNumber(result));
          setPrevValue(result);
        }
        setOperator('×');
        setWaitingForOperand(true);
      } else if (key === '/') {
        e.preventDefault();
        const current = parseFormattedNumber(currentDisplay);
        if (currentPrevValue === null) {
          setPrevValue(current);
        } else if (currentOperator) {
          const result = calculate(currentPrevValue, current, currentOperator);
          setDisplay(formatNumber(result));
          setPrevValue(result);
        }
        setOperator('÷');
        setWaitingForOperand(true);
      } else if (key === 'Enter' || key === '=') {
        if (currentOperator && currentPrevValue !== null) {
          const current = parseFormattedNumber(currentDisplay);
          const result = calculate(currentPrevValue, current, currentOperator);
          setDisplay(formatNumber(result));
          setPrevValue(null);
          setOperator(null);
          setWaitingForOperand(true);
        }
      } else if (key === 'Escape') {
        setDisplay('0');
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(false);
      } else if (key === 'Backspace') {
        e.preventDefault();
        const cleaned = currentDisplay.replace(/\./g, '');
        if (cleaned.length > 1) {
          const newValue = cleaned.slice(0, -1);
          setDisplay(formatNumber(newValue));
        } else {
          setDisplay('0');
        }
        setWaitingForOperand(false);
      } else if (key === '%') {
        const current = parseFormattedNumber(currentDisplay);
        setDisplay(formatNumber(current / 100));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [display, prevValue, operator, waitingForOperand]);

  const getButtonStyle = (btn: string) => {
    if (['+', '-', '×', '÷', '='].includes(btn)) {
      return 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
    if (['C', '⌫'].includes(btn)) {
      return 'bg-destructive/20 text-destructive hover:bg-destructive/30';
    }
    if (['±', '%'].includes(btn)) {
      return 'bg-muted text-foreground hover:bg-muted/80';
    }
    return 'bg-card text-foreground border border-white/10 hover:bg-card/80';
  };

  return (
    <div className="widget">
      <div className="bg-muted rounded-xl p-4 mb-4">
        <div className="text-right">
          <span className="text-muted-foreground text-sm">
            {prevValue !== null ? `${prevValue} ${operator}` : ''}
          </span>
          <div className="text-3xl font-mono font-bold text-gradient-primary truncate">
            {formatNumber(display)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {buttons.flat().map((btn, index) => (
          <motion.button
            key={`${btn}-${index}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleButton(btn)}
            className={`
              ${getButtonStyle(btn)}
              ${btn === '0' ? 'col-span-2' : ''}
              h-14 rounded-xl font-semibold text-lg transition-all
              active:scale-95
              flex items-center justify-center
            `}
          >
            {btn === '⌫' ? (
              <Delete className="w-5 h-5" />
            ) : btn === 'C' ? (
              <RotateCcw className="w-5 h-5" />
            ) : (
              btn
            )}
          </motion.button>
        ))}
        {/* Equals button - separate row */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleEquals()}
          className="col-span-4 h-14 rounded-xl font-semibold text-lg transition-all active:scale-95 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90"
        >
          =
        </motion.button>
      </div>
    </div>
  );
};
