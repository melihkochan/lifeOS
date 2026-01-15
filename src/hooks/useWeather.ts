import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  conditionCode: number;
  city: string;
  country: string;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

const weatherConditions: Record<number, { tr: string; en: string }> = {
  0: { tr: 'Açık', en: 'Clear' },
  1: { tr: 'Çoğunlukla Açık', en: 'Mainly Clear' },
  2: { tr: 'Parçalı Bulutlu', en: 'Partly Cloudy' },
  3: { tr: 'Kapalı', en: 'Overcast' },
  45: { tr: 'Sisli', en: 'Foggy' },
  48: { tr: 'Kırağılı Sis', en: 'Depositing Rime Fog' },
  51: { tr: 'Hafif Çisenti', en: 'Light Drizzle' },
  53: { tr: 'Orta Çisenti', en: 'Moderate Drizzle' },
  55: { tr: 'Yoğun Çisenti', en: 'Dense Drizzle' },
  61: { tr: 'Hafif Yağmur', en: 'Slight Rain' },
  63: { tr: 'Orta Yağmur', en: 'Moderate Rain' },
  65: { tr: 'Şiddetli Yağmur', en: 'Heavy Rain' },
  71: { tr: 'Hafif Kar', en: 'Slight Snow' },
  73: { tr: 'Orta Kar', en: 'Moderate Snow' },
  75: { tr: 'Yoğun Kar', en: 'Heavy Snow' },
  80: { tr: 'Hafif Sağanak', en: 'Slight Showers' },
  81: { tr: 'Orta Sağanak', en: 'Moderate Showers' },
  82: { tr: 'Şiddetli Sağanak', en: 'Violent Showers' },
  95: { tr: 'Gök Gürültülü Fırtına', en: 'Thunderstorm' },
};

export const useWeather = (language: 'tr' | 'en') => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          // Default to Istanbul if location denied
          setLocation({ latitude: 41.0082, longitude: 28.9784 });
        }
      );
    } else {
      // Default to Istanbul
      setLocation({ latitude: 41.0082, longitude: 28.9784 });
    }
  }, []);

  // Fetch weather when location is available
  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        
        // Fetch weather from Open-Meteo (free, no API key needed)
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
        );
        const weatherData = await weatherRes.json();

        // Fetch city name from reverse geocoding
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=&count=1&latitude=${location.latitude}&longitude=${location.longitude}`
        );
        
        // Alternative: Use nominatim for reverse geocoding (free)
        const nominatimRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json&accept-language=${language}`
        );
        const nominatimData = await nominatimRes.json();

        const current = weatherData.current;
        const conditionCode = current.weather_code;
        const conditionText = weatherConditions[conditionCode] || { tr: 'Bilinmiyor', en: 'Unknown' };

        setWeather({
          temp: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          condition: conditionText[language],
          conditionCode,
          city: nominatimData.address?.city || nominatimData.address?.town || nominatimData.address?.village || nominatimData.address?.state || 'Unknown',
          country: nominatimData.address?.country || '',
        });
        setError(null);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(language === 'tr' ? 'Hava durumu alınamadı' : 'Weather unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location, language]);

  return { weather, loading, error };
};
