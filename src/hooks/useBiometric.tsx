import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Try to import Capacitor LocalAuthentication (may not be available)
let LocalAuthentication: any = null;
try {
  const module = require('@capacitor/local-authentication');
  LocalAuthentication = module.LocalAuthentication;
} catch (e) {
  // Plugin not installed, will use WebAuthn fallback
  console.log('LocalAuthentication plugin not available, using WebAuthn fallback');
}

export const useBiometric = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check if biometric authentication is available
    const checkAvailability = async () => {
      // Try native first (if plugin available)
      if (LocalAuthentication) {
        try {
          const available = await LocalAuthentication.checkAvailability();
          setIsSupported(available.isAvailable);
          return;
        } catch (error) {
          console.error('Native biometric check error:', error);
        }
      }
      
      // Fallback to WebAuthn
      if ('credentials' in navigator && 'PublicKeyCredential' in window) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch (error) {
          console.error('WebAuthn availability check error:', error);
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    checkAvailability();
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);

    try {
      // Try native biometric first (if plugin available)
      if (LocalAuthentication) {
        try {
          const result = await LocalAuthentication.authenticate({
            reason: 'Uygulamaya erişmek için kimlik doğrulaması gerekli',
            title: 'LifeOS Kilidi',
            subtitle: 'Biyometrik kimlik doğrulama',
            description: 'Parmak izi veya yüz tanıma ile giriş yapın',
          });

          if (result.authenticated) {
            setIsAuthenticated(true);
            setIsChecking(false);
            return true;
          }

          setIsChecking(false);
          return false;
        } catch (nativeError: any) {
          // If user cancelled, don't show error
          if (nativeError.message?.includes('cancel') || 
              nativeError.message?.includes('User') ||
              nativeError.message?.includes('NotAvailable')) {
            setIsChecking(false);
            return false;
          }
          // Continue to WebAuthn fallback
          console.log('Native auth failed, trying WebAuthn:', nativeError);
        }
      }

      // Fallback to WebAuthn (web or if native failed)
      if ('credentials' in navigator && 'PublicKeyCredential' in window) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          
          if (!available) {
            toast.error('Biyometrik kimlik doğrulama bu cihazda desteklenmiyor');
            setIsChecking(false);
            return false;
          }

          const credential = await navigator.credentials.get({
            publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)),
              allowCredentials: [],
              userVerification: 'required',
              timeout: 60000,
            },
          } as CredentialRequestOptions);

          if (credential) {
            setIsAuthenticated(true);
            setIsChecking(false);
            return true;
          }
        } catch (webauthnError: any) {
          if (webauthnError.name === 'NotAllowedError') {
            // User cancelled
            setIsChecking(false);
            return false;
          }
          throw webauthnError;
        }
      }

      toast.error('Biyometrik kimlik doğrulama bu cihazda desteklenmiyor');
      setIsChecking(false);
      return false;
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      if (error.name === 'NotAllowedError' || error.message?.includes('cancel')) {
        setIsChecking(false);
        return false;
      }
      
      toast.error('Biyometrik kimlik doğrulama hatası: ' + (error.message || 'Bilinmeyen hata'));
      setIsChecking(false);
      return false;
    }
  }, []);

  const checkBiometricLock = useCallback(async (): Promise<boolean> => {
    // Get biometric lock setting from localStorage
    const privacyPrefs = JSON.parse(localStorage.getItem('lifeOS-privacy') || '{}');
    const lockEnabled = privacyPrefs.lockEnabled ?? false;
    
    if (!lockEnabled) {
      // Lock is disabled, allow access
      setIsAuthenticated(true);
      return true;
    }

    // Lock is enabled, require authentication
    if (!isSupported) {
      // Biometric not supported, allow access (fallback)
      toast.warning('Biyometrik kimlik doğrulama desteklenmiyor, erişim verildi');
      setIsAuthenticated(true);
      return true;
    }

    // Request biometric authentication
    return await authenticate();
  }, [isSupported, authenticate]);

  return {
    isSupported,
    isAuthenticated,
    isChecking,
    authenticate,
    checkBiometricLock,
  };
};
