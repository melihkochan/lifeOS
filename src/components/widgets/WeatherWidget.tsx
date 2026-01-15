import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Droplets, Wind, MapPin, Loader2 } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { useTranslation } from '@/hooks/useTranslation';

const getWeatherIcon = (code: number) => {
  if (code === 0 || code === 1) return Sun;
  if (code === 2 || code === 3) return Cloud;
  if (code >= 45 && code <= 48) return CloudFog;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95) return CloudLightning;
  return Cloud;
};

export const WeatherWidget = () => {
  const { t, language } = useTranslation();
  const { weather, loading, error } = useWeather(language);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="widget-animated flex items-center justify-center py-8"
      >
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="ml-2 text-muted-foreground">{t.loading}</span>
      </motion.div>
    );
  }

  if (error || !weather) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="widget-animated text-center py-6 text-muted-foreground"
      >
        {error || t.locationError}
      </motion.div>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.conditionCode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
      className="widget-animated relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
            <MapPin className="w-3 h-3" />
            <span>{weather.city}, {weather.country}</span>
          </div>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-8xl font-bold text-gradient-primary leading-none">{weather.temp}°</span>
            <span className="text-muted-foreground text-4xl">C</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-foreground/80">{weather.condition}</p>
            <p className="text-xs text-muted-foreground">
              {t.feelsLike}: {weather.feelsLike}°C
            </p>
          </div>
        </div>
        <div className="relative flex flex-col items-end gap-3">
          <WeatherIcon className="w-14 h-14 text-primary animate-pulse-glow" />
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-primary" />
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">{weather.humidity}%</span>
                <p className="text-xs text-muted-foreground">{t.humidity}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-primary" />
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">{weather.windSpeed} km/s</span>
                <p className="text-xs text-muted-foreground">{t.wind}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
