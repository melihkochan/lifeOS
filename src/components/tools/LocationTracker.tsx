import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, Globe, Copy, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  address?: string;
}

export const LocationTracker = () => {
  const { t } = useTranslation();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const getAddress = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${t.language || 'tr'}`
      );
      const data = await response.json();
      return data.display_name;
    } catch {
      return null;
    }
  };

  const updateLocation = async (position: GeolocationPosition) => {
    const address = await getAddress(position.coords.latitude, position.coords.longitude);
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      address,
    });
    setLoading(false);
  };

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      updateLocation,
      (error) => {
        toast.error(t.locationError);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const toggleWatch = () => {
    if (watching && watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setWatching(false);
    } else {
      const id = navigator.geolocation.watchPosition(
        updateLocation,
        (error) => {
          toast.error(t.locationError);
        },
        { enableHighAccuracy: true }
      );
      setWatchId(id);
      setWatching(true);
    }
  };

  useEffect(() => {
    getCurrentLocation();
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const copyCoords = () => {
    if (location) {
      navigator.clipboard.writeText(`${location.latitude}, ${location.longitude}`);
      toast.success(t.copied);
    }
  };

  const openInMaps = () => {
    if (location) {
      window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank');
    }
  };

  const getDirection = (heading: number | null) => {
    if (heading === null) return '-';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  return (
    <div className="space-y-4">
      <div className="widget">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{t.location}</h3>
          </div>
          <motion.div
            animate={{ scale: watching ? [1, 1.2, 1] : 1 }}
            transition={{ repeat: watching ? Infinity : 0, duration: 1 }}
            className={`w-3 h-3 rounded-full ${watching ? 'bg-success' : 'bg-muted'}`}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : location ? (
          <div className="space-y-4">
            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">{t.latitude}</p>
                <p className="font-mono font-medium">{location.latitude.toFixed(6)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">{t.longitude}</p>
                <p className="font-mono font-medium">{location.longitude.toFixed(6)}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-muted/50">
                <Navigation className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">{t.accuracy}</p>
                <p className="text-sm font-medium">{location.accuracy.toFixed(0)}m</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <Compass className="w-4 h-4 mx-auto mb-1 text-secondary" />
                <p className="text-xs text-muted-foreground">{t.heading}</p>
                <p className="text-sm font-medium">{getDirection(location.heading)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <Globe className="w-4 h-4 mx-auto mb-1 text-warning" />
                <p className="text-xs text-muted-foreground">{t.altitude}</p>
                <p className="text-sm font-medium">{location.altitude?.toFixed(0) || '-'}m</p>
              </div>
            </div>

            {/* Speed */}
            {location.speed !== null && location.speed > 0 && (
              <div className="p-3 rounded-xl bg-primary/10 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t.speed}</p>
                <p className="text-2xl font-bold text-primary">{(location.speed * 3.6).toFixed(1)} km/h</p>
              </div>
            )}

            {/* Address */}
            {location.address && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">{t.address}</p>
                <p className="text-sm">{location.address}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">{t.locationError}</p>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleWatch}
          className={`py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
            watching ? 'bg-success text-success-foreground' : 'bg-muted hover:bg-muted/80'
          }`}
        >
          <Navigation className="w-4 h-4" />
          {watching ? t.stopTracking : t.liveTracking}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={getCurrentLocation}
          className="py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 font-medium flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          {t.refresh}
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={copyCoords}
          disabled={!location}
          className="py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
          {t.copyCoords}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={openInMaps}
          disabled={!location}
          className="py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ExternalLink className="w-4 h-4" />
          {t.openMaps}
        </motion.button>
      </div>
    </div>
  );
};
