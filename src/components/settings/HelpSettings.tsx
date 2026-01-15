import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { HelpCircle, ChevronDown, MessageCircle, Mail, FileText, ExternalLink, X, CheckSquare, FileText as FileTextIcon, Wallet, BarChart3, Settings, Home } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface FAQ {
  question: string;
  answer: string;
}

export const HelpSettings = ({ onBack }: { onBack: () => void }) => {
  const { t, language } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showUserGuide, setShowUserGuide] = useState(false);

  const faqs: FAQ[] = [
    { question: t.faq1Question, answer: t.faq1Answer },
    { question: t.faq2Question, answer: t.faq2Answer },
    { question: t.faq3Question, answer: t.faq3Answer },
    { question: t.faq4Question, answer: t.faq4Answer },
    { question: t.faq5Question, answer: t.faq5Answer },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <button onClick={onBack} className="text-primary text-sm mb-2 hover:underline">
          ← {t.back}
        </button>
        <h1 className="text-2xl font-bold">{t.help}</h1>
        <p className="text-muted-foreground text-sm">{t.helpDesc}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.a
          href="mailto:melihkochan00@gmail.com?subject=LifeOS Destek Talebi&body=Merhaba,%0D%0A%0D%0ALütfen sorunuzu veya talebinizi buraya yazın...%0D%0A%0D%0ATeşekkürler!"
          whileTap={{ scale: 0.95 }}
          className="widget flex flex-col items-center gap-2 py-6"
        >
          <Mail className="w-8 h-8 text-primary" />
          <span className="text-sm font-medium">{t.emailSupport}</span>
        </motion.a>
        <motion.div
          className="widget flex flex-col items-center gap-2 py-6 opacity-50 cursor-not-allowed"
        >
          <MessageCircle className="w-8 h-8 text-secondary" />
          <span className="text-sm font-medium text-muted-foreground">{t.liveChat}</span>
          <span className="text-xs text-muted-foreground mt-1">Yakında</span>
        </motion.div>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground px-1">{t.faq}</h3>
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={false}
            className="widget overflow-hidden"
          >
            <motion.button
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-medium text-left text-sm">{faq.question}</span>
              </div>
              <motion.div
                animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </motion.button>
            <motion.div
              initial={false}
              animate={{
                height: expandedFaq === index ? 'auto' : 0,
                opacity: expandedFaq === index ? 1 : 0,
              }}
              className="overflow-hidden"
            >
              <p className="text-sm text-muted-foreground mt-3 pl-8">{faq.answer}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Resources */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground px-1">{t.resources}</h3>
        
        <motion.button
          onClick={() => setShowUserGuide(true)}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
          className="widget flex items-center gap-3 w-full text-left cursor-pointer border-2 border-primary/20 hover:border-primary/40 transition-all hover:bg-primary/5 group"
        >
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold group-hover:text-primary transition-colors">{t.userGuide}</p>
            <p className="text-xs text-muted-foreground">{t.userGuideDesc}</p>
          </div>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-primary opacity-60"
          >
            <ExternalLink className="w-5 h-5" />
          </motion.div>
        </motion.button>

        <motion.div
          className="widget flex items-center gap-3 opacity-50"
        >
          <FileText className="w-5 h-5 text-secondary" />
          <div className="flex-1">
            <p className="font-medium text-muted-foreground">{t.videoTutorials}</p>
            <p className="text-xs text-muted-foreground">{t.videoTutorialsDesc}</p>
          </div>
          <span className="text-xs text-muted-foreground">Yakında</span>
        </motion.div>
      </div>

      {/* User Guide Modal */}
      <AnimatePresence>
        {showUserGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUserGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-border shadow-xl pb-24"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t.userGuide}</h2>
                <button
                  onClick={() => setShowUserGuide(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 text-sm">
                {/* Getting Started */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    {language === 'tr' ? 'Başlangıç' : 'Getting Started'}
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    {language === 'tr' 
                      ? 'LifeOS\'a hoş geldiniz! Uygulama, hayatınızı organize etmenize yardımcı olmak için tasarlandı. İlk kullanımda hesap oluşturmanız gerekmektedir.'
                      : 'Welcome to LifeOS! The app is designed to help you organize your life. On first use, you need to create an account.'}
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'E-posta ve şifre ile hesap oluşturun' : 'Create an account with email and password'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Tüm verileriniz güvenli Supabase veritabanında saklanır' : 'All your data is stored securely in Supabase database'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Aynı hesap ile farklı cihazlardan erişebilirsiniz' : 'You can access from different devices with the same account'}</span>
                    </li>
                  </ul>
                </section>

                {/* Tasks */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    {language === 'tr' ? 'Görevler' : 'Tasks'}
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    {language === 'tr'
                      ? 'Görevler bölümünde günlük işlerinizi organize edebilirsiniz. Görevlerinize kategori, öncelik ve alt görevler ekleyebilirsiniz.'
                      : 'In the Tasks section, you can organize your daily tasks. You can add categories, priorities, and subtasks to your tasks.'}
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Yeni görev eklemek için "+" butonuna tıklayın' : 'Click the "+" button to add a new task'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Görevleri kategorilere göre filtreleyebilirsiniz' : 'You can filter tasks by categories'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Mobilde basılı tutarak görevleri yeniden sıralayabilirsiniz' : 'On mobile, hold and drag to reorder tasks'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Alt görevler ekleyerek karmaşık işleri bölümlere ayırabilirsiniz' : 'Add subtasks to break down complex tasks'}</span>
                    </li>
                  </ul>
                </section>

                {/* Notes */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileTextIcon className="w-5 h-5 text-primary" />
                    {language === 'tr' ? 'Notlar' : 'Notes'}
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    {language === 'tr'
                      ? 'Notlar bölümünde fikirlerinizi, hatırlatıcılarınızı ve önemli bilgilerinizi saklayabilirsiniz. Notlarınızı kategorilere ayırabilir ve renklendirebilirsiniz.'
                      : 'In the Notes section, you can store your ideas, reminders, and important information. You can categorize and color-code your notes.'}
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Hızlı not eklemek için alttaki input alanını kullanın' : 'Use the input field at the bottom to quickly add notes'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Önemli notları şifre ile kilitleyebilirsiniz' : 'You can lock important notes with a password'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Notlarınızı kategorilere göre filtreleyebilirsiniz' : 'You can filter notes by categories'}</span>
                    </li>
                  </ul>
                </section>

                {/* Wallet */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    {language === 'tr' ? 'Cüzdan' : 'Wallet'}
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    {language === 'tr'
                      ? 'Cüzdan bölümünde gelir ve giderlerinizi takip edebilirsiniz. Bütçe hedefleri belirleyebilir ve finansal durumunuzu analiz edebilirsiniz.'
                      : 'In the Wallet section, you can track your income and expenses. You can set budget goals and analyze your financial situation.'}
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Gelir ve gider eklemek için kategori seçin ve tutarı girin' : 'Select a category and enter the amount to add income or expense'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'İşlemleri düzenleyebilir veya silebilirsiniz' : 'You can edit or delete transactions'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Bütçe hedefi belirleyerek harcamalarınızı kontrol altında tutabilirsiniz' : 'Set a budget goal to keep your spending under control'}</span>
                    </li>
                  </ul>
                </section>

                {/* Analytics */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {language === 'tr' ? 'Analiz' : 'Analytics'}
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    {language === 'tr'
                      ? 'Analiz bölümünde finansal durumunuzu grafikler ve istatistiklerle görüntüleyebilirsiniz. Tasarruf hedefleri belirleyebilirsiniz.'
                      : 'In the Analytics section, you can view your financial situation with charts and statistics. You can set savings goals.'}
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Gelir ve gider grafiklerini inceleyin' : 'Review income and expense charts'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Tasarruf hedefi belirleyerek ilerlemenizi takip edin' : 'Set a savings goal and track your progress'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Kategori bazlı harcama analizlerini görüntüleyin' : 'View category-based spending analyses'}</span>
                    </li>
                  </ul>
                </section>

                {/* Settings */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    {language === 'tr' ? 'Ayarlar' : 'Settings'}
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    {language === 'tr'
                      ? 'Ayarlar bölümünde uygulamanızı kişiselleştirebilirsiniz. Tema, bildirimler, gizlilik ve daha fazlasını yapılandırabilirsiniz.'
                      : 'In the Settings section, you can personalize your app. You can configure theme, notifications, privacy, and more.'}
                  </p>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Tema, vurgu rengi ve yazı boyutunu değiştirebilirsiniz' : 'You can change theme, accent color, and font size'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Bildirim ayarlarını yapılandırabilirsiniz' : 'You can configure notification settings'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Biyometrik kilitle uygulamanızı güvence altına alabilirsiniz' : 'You can secure your app with biometric lock'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Verilerinizi dışa aktarabilir veya içe aktarabilirsiniz' : 'You can export or import your data'}</span>
                    </li>
                  </ul>
                </section>

                {/* Tips */}
                <section className="bg-primary/5 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold mb-3">
                    {language === 'tr' ? '💡 İpuçları' : '💡 Tips'}
                  </h3>
                  <ul className="space-y-2 text-muted-foreground ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Kompakt modu aktif ederek daha fazla içerik görüntüleyebilirsiniz' : 'Enable compact mode to view more content'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Sessiz saatler özelliği ile bildirimleri belirli saatlerde kapatabilirsiniz' : 'Use quiet hours to disable notifications during specific hours'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{language === 'tr' ? 'Gizlilik ayarlarından bakiyeleri ve tutarları gizleyebilirsiniz' : 'You can hide balances and amounts from privacy settings'}</span>
                    </li>
                  </ul>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
