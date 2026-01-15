import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          // Email confirmation hatası için özel mesaj
          if (error.message.includes('doğrulama linki')) {
            toast.error(error.message, {
              duration: 5000,
              description: 'E-postanızı kontrol edin veya Supabase Dashboard\'da email confirmation\'ı kapatın.',
            });
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Başarıyla giriş yaptınız!');
        }
      } else {
        // Kayıt işlemi
        const { data, error: signUpError } = await signUp(email, password);
        if (signUpError) {
          // "User already registered" hatası için özel mesaj
          if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
            toast.error('Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın veya farklı bir e-posta kullanın.');
          } else {
            toast.error(signUpError.message || 'Kayıt başarısız');
          }
        } else if (data?.user) {
          // Trigger otomatik olarak profil oluşturuyor, sadece güncelle
          const fullName = `${name} ${surname}`.trim();
          
          // Biraz bekle ki trigger çalışsın
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Profil kaydını güncelle (trigger zaten oluşturmuş olmalı)
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: fullName || name || surname,
              email: email,
              phone: phone || null,
            })
            .eq('user_id', data.user.id);

          if (profileError) {
            console.error('Profil güncelleme hatası:', profileError);
            // Hata olsa bile devam et, trigger zaten oluşturmuş olabilir
          }

          toast.success('Hesap oluşturuldu! Giriş yapabilirsiniz.');
          setIsLogin(true);
          // Formu temizle
          setName('');
          setSurname('');
          setPhone('');
        }
      }
    } catch (err) {
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg bg-transparent"
          >
            <img 
              src="/lifOSlogo.png" 
              alt="LifeOS Logo" 
              className="w-full h-full object-contain"
            />
          </motion.div>
          <h1 className="text-2xl font-bold">LifeOS</h1>
          <p className="text-muted-foreground mt-1">
            {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
          </p>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl p-6 shadow-lg border space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">İsim</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="İsminiz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Soyisim</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Soyisminiz"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon (Opsiyonel)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+90 555 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                minLength={6}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.form>

        {/* Toggle */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
