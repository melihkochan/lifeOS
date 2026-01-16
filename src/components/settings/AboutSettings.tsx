import { motion, AnimatePresence } from 'framer-motion';
import { Info, Heart, Github, Twitter, Globe, Star, Shield, Zap, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';

export const AboutSettings = ({ onBack }: { onBack: () => void }) => {
  const { t, language } = useTranslation();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);

  const features = [
    { icon: Zap, label: t.featureTaskManagement },
    { icon: Shield, label: t.featurePrivacy },
    { icon: Star, label: t.featureAnalytics },
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
        <h1 className="text-2xl font-bold">{t.about}</h1>
        <p className="text-muted-foreground text-sm">{t.aboutDesc}</p>
      </div>

      {/* Logo & Version */}
      <div className="widget text-center py-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 mx-auto mb-4 flex items-center justify-center"
        >
          <img 
            src="/lifOSlogo.png" 
            alt="LifeOS Logo" 
            className="w-full h-full object-contain"
          />
        </motion.div>
        <h2 className="text-2xl font-bold">LifeOS</h2>
        <p className="text-muted-foreground">{t.appTagline}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
          <Info className="w-4 h-4 text-primary" />
          <span className="text-sm">v1.2.0</span>
        </div>
      </div>

      {/* Features */}
      <div className="widget">
        <h3 className="font-medium mb-4">{t.keyFeatures}</h3>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm">{feature.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="widget">
        <h3 className="font-medium mb-4">{t.followUs}</h3>
        <div className="grid grid-cols-3 gap-3">
          <motion.a
            href="https://github.com/melihkochan"
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Github className="w-6 h-6" />
            <span className="text-xs">GitHub</span>
          </motion.a>
          <motion.a
            href="https://x.com/melihkochan1"
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Twitter className="w-6 h-6" />
            <span className="text-xs">X (Twitter)</span>
          </motion.a>
          <motion.a
            href="https://www.melihkochan.com/"
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Globe className="w-6 h-6" />
            <span className="text-xs">Website</span>
          </motion.a>
        </div>
      </div>

      {/* Legal */}
      <div className="space-y-2">
        <motion.button
          onClick={() => setShowTerms(true)}
          whileTap={{ scale: 0.98 }}
          className="widget flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">{t.termsOfService}</span>
          <span className="text-muted-foreground">→</span>
        </motion.button>
        <motion.button
          onClick={() => setShowPrivacy(true)}
          whileTap={{ scale: 0.98 }}
          className="widget flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">{t.privacyPolicy}</span>
          <span className="text-muted-foreground">→</span>
        </motion.button>
        <motion.button
          onClick={() => setShowLicenses(true)}
          whileTap={{ scale: 0.98 }}
          className="widget flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">{t.licenses}</span>
          <span className="text-muted-foreground">→</span>
        </motion.button>
      </div>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTerms(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-border shadow-xl pb-24"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t.termsOfService}</h2>
                <button
                  onClick={() => setShowTerms(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '1. Kullanım Koşulları' : '1. Terms of Use'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'LifeOS uygulamasını kullanarak, aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız. Uygulamayı kullanmaya devam ederseniz, bu koşullara bağlı kalmayı kabul edersiniz.'
                      : 'By using the LifeOS application, you agree to the following terms of use. If you continue to use the application, you agree to be bound by these terms.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '2. Hesap Sorumluluğu' : '2. Account Responsibility'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi güvenli tutmalı ve başkalarıyla paylaşmamalısınız. Hesabınız altında yapılan tüm işlemlerden siz sorumlusunuz.'
                      : 'You are responsible for the security of your account. You must keep your password secure and not share it with others. You are responsible for all actions taken under your account.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '3. Veri Kullanımı' : '3. Data Usage'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'Tüm verileriniz güvenli Supabase veritabanında saklanır. Verileriniz yalnızca uygulama işlevselliği için kullanılır ve üçüncü taraflarla paylaşılmaz.'
                      : 'All your data is stored securely in the Supabase database. Your data is only used for application functionality and is not shared with third parties.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '4. Hizmet Değişiklikleri' : '4. Service Changes'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'LifeOS, hizmetleri önceden haber vermeksizin değiştirme, askıya alma veya sonlandırma hakkını saklı tutar.'
                      : 'LifeOS reserves the right to modify, suspend, or terminate services without prior notice.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '5. Sorumluluk Reddi' : '5. Disclaimer'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'LifeOS, uygulamanın kesintisiz veya hatasız çalışacağını garanti etmez. Uygulama "olduğu gibi" sağlanır ve herhangi bir zarar için sorumluluk kabul edilmez.'
                      : 'LifeOS does not guarantee that the application will work uninterrupted or error-free. The application is provided "as is" and no liability is accepted for any damages.'}
                  </p>
                </section>
                <section>
                  <p className="text-xs text-muted-foreground mt-6">
                    {language === 'tr'
                      ? 'Son güncelleme: Ocak 2025'
                      : 'Last updated: January 2025'}
                  </p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrivacy(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-border shadow-xl pb-24"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t.privacyPolicy}</h2>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '1. Veri Toplama' : '1. Data Collection'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'LifeOS, uygulama işlevselliği için gerekli olan minimum veriyi toplar. Bu veriler arasında e-posta adresi, görevler, notlar, finansal işlemler ve uygulama tercihleri bulunur.'
                      : 'LifeOS collects the minimum data necessary for application functionality. This data includes email address, tasks, notes, financial transactions, and application preferences.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '2. Veri Saklama' : '2. Data Storage'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'Tüm verileriniz şifrelenmiş Supabase veritabanında güvenli bir şekilde saklanır. Verileriniz endüstri standardı güvenlik önlemleri ile korunur.'
                      : 'All your data is stored securely in the encrypted Supabase database. Your data is protected with industry-standard security measures.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '3. Veri Kullanımı' : '3. Data Usage'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'Toplanan veriler yalnızca uygulama işlevselliğini sağlamak için kullanılır. Verileriniz reklam veya pazarlama amaçlı kullanılmaz ve üçüncü taraflarla paylaşılmaz.'
                      : 'Collected data is only used to provide application functionality. Your data is not used for advertising or marketing purposes and is not shared with third parties.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '4. Veri Silme' : '4. Data Deletion'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'Hesabınızı istediğiniz zaman silebilirsiniz. Hesap silindiğinde, tüm verileriniz kalıcı olarak silinir ve geri alınamaz.'
                      : 'You can delete your account at any time. When the account is deleted, all your data is permanently deleted and cannot be recovered.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '5. Çerezler' : '5. Cookies'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'LifeOS, uygulama işlevselliği için gerekli çerezleri kullanır. Bu çerezler kullanıcı tercihlerini saklamak ve oturum yönetimi için kullanılır.'
                      : 'LifeOS uses cookies necessary for application functionality. These cookies are used to store user preferences and for session management.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? '6. İletişim' : '6. Contact'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'Gizlilik politikası hakkında sorularınız için melihkochan00@gmail.com adresinden bize ulaşabilirsiniz.'
                      : 'For questions about the privacy policy, you can contact us at melihkochan00@gmail.com.'}
                  </p>
                </section>
                <section>
                  <p className="text-xs text-muted-foreground mt-6">
                    {language === 'tr'
                      ? 'Son güncelleme: Ocak 2025'
                      : 'Last updated: January 2025'}
                  </p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Licenses Modal */}
      <AnimatePresence>
        {showLicenses && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLicenses(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-border shadow-xl pb-24"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t.licenses}</h2>
                <button
                  onClick={() => setShowLicenses(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? 'LifeOS Lisansı' : 'LifeOS License'}
                  </h3>
                  <p className="mb-2">
                    {language === 'tr'
                      ? 'Copyright © 2025 Melih Koçhan. Tüm hakları saklıdır.'
                      : 'Copyright © 2025 Melih Koçhan. All rights reserved.'}
                  </p>
                  <p>
                    {language === 'tr'
                      ? 'Bu yazılım ve ilgili belgeler ("Yazılım"), telif hakkı yasaları ve uluslararası telif hakkı anlaşmaları tarafından korunmaktadır.'
                      : 'This software and related documentation ("Software") are protected by copyright laws and international copyright agreements.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? 'Kullanım İzni' : 'Usage Permission'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'LifeOS uygulaması kişisel ve ticari olmayan kullanım için ücretsizdir. Ticari kullanım için lisans sahibinden izin alınması gerekir.'
                      : 'The LifeOS application is free for personal and non-commercial use. Commercial use requires permission from the license holder.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? 'Üçüncü Taraf Kütüphaneler' : 'Third-Party Libraries'}
                  </h3>
                  <p className="mb-2">
                    {language === 'tr'
                      ? 'LifeOS aşağıdaki açık kaynak kütüphaneleri kullanmaktadır:'
                      : 'LifeOS uses the following open-source libraries:'}
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>React, React DOM - MIT License</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>TypeScript - Apache License 2.0</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Tailwind CSS - MIT License</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Framer Motion - MIT License</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Supabase - Apache License 2.0</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Lucide React - ISC License</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Zustand - MIT License</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>date-fns - MIT License</span>
                    </li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {language === 'tr' ? 'Kısıtlamalar' : 'Restrictions'}
                  </h3>
                  <p>
                    {language === 'tr'
                      ? 'Yazılımı değiştirmek, tersine mühendislik yapmak veya kaynak kodunu kopyalamak yasaktır. Ticari kullanım için lisans sahibi ile iletişime geçin.'
                      : 'Modifying the software, reverse engineering, or copying the source code is prohibited. Contact the license holder for commercial use.'}
                  </p>
                </section>
                <section>
                  <p className="text-xs text-muted-foreground mt-6">
                    {language === 'tr'
                      ? 'Son güncelleme: Ocak 2025'
                      : 'Last updated: January 2025'}
                  </p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          {t.madeWith}.
        </p>
        <p className="text-xs text-muted-foreground mt-1">© 2025 LifeOS</p>
      </div>
    </motion.div>
  );
};
