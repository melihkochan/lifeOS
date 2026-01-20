import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfaya Dön
          </Link>
          <h1 className="text-4xl font-bold mb-2">Gizlilik Politikası</h1>
          <p className="text-muted-foreground">
            Son güncelleme: Ocak 2025
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-8 border space-y-8"
        >
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Giriş</h2>
            <p className="text-muted-foreground leading-relaxed">
              LifeOS ("biz", "bizim" veya "uygulamamız") olarak, kullanıcılarımızın gizliliğine büyük önem veriyoruz. 
              Bu Gizlilik Politikası, LifeOS uygulamasını kullandığınızda hangi bilgileri topladığımızı, 
              bu bilgileri nasıl kullandığımızı ve paylaştığımızı açıklamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Toplanan Bilgiler</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">2.1. Hesap Bilgileri</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Uygulamaya kayıt olduğunuzda, e-posta adresiniz ve şifreniz gibi temel hesap bilgilerinizi toplarız. 
                  Ayrıca profil bilgilerinizi (isim, telefon numarası, profil fotoğrafı) saklayabiliriz.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">2.2. Kullanım Verileri</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Uygulama içinde oluşturduğunuz görevler, notlar, finansal işlemler ve diğer içerikler 
                  güvenli bir şekilde saklanır. Bu veriler yalnızca hesabınızla ilişkilendirilir ve 
                  siz dışında kimseyle paylaşılmaz.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">2.3. Cihaz Bilgileri</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Hava durumu gibi özellikler için konum bilgisi kullanılabilir. Bu bilgiler yalnızca 
                  uygulama içinde kullanılır ve saklanmaz. Konum erişimi isteğe bağlıdır ve reddedebilirsiniz.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Veri Depolama ve Güvenlik</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">3.1. Veri Depolama</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tüm verileriniz güvenli Supabase bulut veritabanında saklanır. Supabase, endüstri standardı 
                  güvenlik önlemleri kullanarak verilerinizi korur. Verileriniz şifrelenmiş bağlantılar üzerinden 
                  aktarılır ve veritabanında şifreli olarak saklanır.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">3.2. Veri Güvenliği</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Verilerinizin güvenliğini sağlamak için uygun teknik ve organizasyonel önlemler alıyoruz. 
                  Bu önlemler arasında şifreli bağlantılar, güvenli kimlik doğrulama ve düzenli güvenlik 
                  güncellemeleri yer alır.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Verilerin Kullanımı</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Topladığımız bilgileri aşağıdaki amaçlar için kullanırız:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Uygulama hizmetlerini sağlamak ve iyileştirmek</li>
              <li>Hesabınızı yönetmek ve kimlik doğrulama yapmak</li>
              <li>Verilerinizi cihazlarınız arasında senkronize etmek</li>
              <li>Teknik sorunları çözmek ve destek sağlamak</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Veri Paylaşımı</h2>
            <p className="text-muted-foreground leading-relaxed">
              Verilerinizi üçüncü taraflarla paylaşmıyoruz. İstisnalar:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
              <li><strong>Supabase:</strong> Veri depolama ve hosting hizmetleri için (veri işleme anlaşması mevcuttur)</li>
              <li><strong>Yasal Gereklilikler:</strong> Yasal bir yükümlülük veya mahkeme kararı gerektirdiğinde</li>
              <li><strong>İzin:</strong> Açıkça izin verdiğiniz durumlarda</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Veri Saklama</h2>
            <p className="text-muted-foreground leading-relaxed">
              Hesabınız aktif olduğu sürece verilerinizi saklarız. Hesabınızı sildiğinizde, 
              verileriniz 30 gün içinde kalıcı olarak silinir. Yasal yükümlülüklerimiz gereği 
              bazı veriler daha uzun süre saklanabilir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Kullanıcı Hakları</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Erişim Hakkı:</strong> Toplanan verilerinize erişebilirsiniz</li>
              <li><strong>Düzeltme Hakkı:</strong> Hatalı verilerinizi düzeltebilirsiniz</li>
              <li><strong>Silme Hakkı:</strong> Hesabınızı ve verilerinizi silebilirsiniz</li>
              <li><strong>Veri Taşınabilirliği:</strong> Verilerinizi dışa aktarabilirsiniz</li>
              <li><strong>İtiraz Hakkı:</strong> Veri işlemeye itiraz edebilirsiniz</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Çerezler ve İzleme</h2>
            <p className="text-muted-foreground leading-relaxed">
              LifeOS, temel işlevsellik için gerekli çerezler kullanır. Üçüncü taraf reklam 
              veya izleme çerezleri kullanılmaz. Tarayıcı ayarlarınızdan çerezleri kontrol edebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Çocukların Gizliliği</h2>
            <p className="text-muted-foreground leading-relaxed">
              LifeOS, 13 yaşın altındaki çocuklardan bilerek bilgi toplamaz. 13 yaşın altında bir 
              çocuğun bilgilerini topladığımızı öğrenirsek, bu bilgileri derhal sileriz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Politika Değişiklikleri</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bu Gizlilik Politikası zaman zaman güncellenebilir. Önemli değişiklikler için 
              size bildirimde bulunacağız. Politikadaki değişiklikler, yayınlandıkları tarihten 
              itibaren geçerlidir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. İletişim</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Gizlilik politikamız hakkında sorularınız veya endişeleriniz varsa, lütfen bizimle iletişime geçin:
            </p>
            <div className="bg-muted rounded-xl p-4">
              <p className="text-foreground font-medium mb-2">E-posta:</p>
              <a 
                href="mailto:melihkochan00@gmail.com" 
                className="text-primary hover:underline"
              >
                melihkochan00@gmail.com
              </a>
            </div>
          </section>

          <section className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Bu Gizlilik Politikası, LifeOS uygulamasının kullanımı için geçerlidir. 
              Uygulamayı kullanarak bu politikayı kabul etmiş sayılırsınız.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Son güncelleme: Ocak 2025
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
