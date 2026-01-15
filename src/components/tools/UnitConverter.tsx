import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRightLeft, Scale, Thermometer, Ruler } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type ConversionType = 'length' | 'weight' | 'temperature';

const conversions = {
  length: {
    units: ['m', 'km', 'cm', 'mm', 'inch', 'ft', 'mile'],
    toBase: { m: 1, km: 1000, cm: 0.01, mm: 0.001, inch: 0.0254, ft: 0.3048, mile: 1609.34 },
  },
  weight: {
    units: ['kg', 'g', 'mg', 'lb', 'oz', 'ton'],
    toBase: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000 },
  },
  temperature: {
    units: ['°C', '°F', 'K'],
    convert: (value: number, from: string, to: string) => {
      let celsius = value;
      if (from === '°F') celsius = (value - 32) * 5/9;
      if (from === 'K') celsius = value - 273.15;
      
      if (to === '°C') return celsius;
      if (to === '°F') return celsius * 9/5 + 32;
      if (to === 'K') return celsius + 273.15;
      return value;
    },
  },
};

export const UnitConverter = () => {
  const { t } = useTranslation();
  const [type, setType] = useState<ConversionType>('length');
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');

  const convert = () => {
    if (!value || isNaN(Number(value))) return '-';
    const num = parseFloat(value);
    
    if (type === 'temperature') {
      const result = conversions.temperature.convert(num, fromUnit, toUnit);
      return result.toFixed(2);
    }
    
    const conv = conversions[type];
    const baseValue = num * (conv.toBase as Record<string, number>)[fromUnit];
    const result = baseValue / (conv.toBase as Record<string, number>)[toUnit];
    return result.toFixed(6).replace(/\.?0+$/, '');
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const getUnits = () => {
    return conversions[type].units;
  };

  const resetUnits = (newType: ConversionType) => {
    setType(newType);
    setValue('');
    if (newType === 'length') { setFromUnit('m'); setToUnit('km'); }
    if (newType === 'weight') { setFromUnit('kg'); setToUnit('g'); }
    if (newType === 'temperature') { setFromUnit('°C'); setToUnit('°F'); }
  };

  return (
    <div className="space-y-4">
      {/* Type Selector */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => resetUnits('length')}
          className={`py-3 rounded-xl flex flex-col items-center gap-1 ${
            type === 'length' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <Ruler className="w-5 h-5" />
          <span className="text-xs">{t.length}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => resetUnits('weight')}
          className={`py-3 rounded-xl flex flex-col items-center gap-1 ${
            type === 'weight' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-xs">{t.weight}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => resetUnits('temperature')}
          className={`py-3 rounded-xl flex flex-col items-center gap-1 ${
            type === 'temperature' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <Thermometer className="w-5 h-5" />
          <span className="text-xs">{t.temperature}</span>
        </motion.button>
      </div>

      {/* Converter */}
      <div className="widget space-y-4">
        {/* From */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">{t.from}</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="flex-1 min-w-0 bg-muted/50 rounded-xl px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="bg-muted rounded-xl px-3 py-2.5 focus:outline-none flex-shrink-0 w-20"
            >
              {getUnits().map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={swapUnits}
            className="p-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5 text-primary rotate-90" />
          </motion.button>
        </div>

        {/* To */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">{t.to}</label>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0 bg-muted/50 rounded-xl px-3 py-2.5 text-base font-mono truncate">
              {convert()}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="bg-muted rounded-xl px-3 py-2.5 focus:outline-none flex-shrink-0 w-20"
            >
              {getUnits().map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
