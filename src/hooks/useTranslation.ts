import { useAppStore } from '@/stores/useAppStore';
import { translations } from '@/lib/translations';

export const useTranslation = () => {
  const { language } = useAppStore();
  
  const t = translations[language];
  
  return { t, language };
};
