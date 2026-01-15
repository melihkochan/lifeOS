import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Copy, Check, Link } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const QRGenerator = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (text.trim()) {
      const encoded = encodeURIComponent(text);
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&bgcolor=1a1a2e&color=00d4ff`);
    } else {
      setQrUrl('');
    }
  }, [text]);

  const handleCopy = async () => {
    if (qrUrl) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error('Copy failed');
      }
    }
  };

  return (
    <div className="widget space-y-4">
      <div className="flex items-center gap-2">
        <Link className="w-5 h-5 text-primary" />
        <span className="font-medium">{t.qrGenerator}</span>
      </div>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.enterUrlOrText}
        className="input-glass w-full"
      />

      {qrUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="bg-foreground p-4 rounded-2xl">
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="btn-glass flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success" />
                {t.copied}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {t.copyText}
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {!text && (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t.enterTextForQR}</p>
        </div>
      )}
    </div>
  );
};
