import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const useBiometric = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check if Web Authentication API is supported
    if ('credentials' in navigator && 'PublicKeyCredential' in window) {
      setIsSupported(true);
    } else if ('credentials' in navigator && 'get' in navigator.credentials) {
      // Fallback for older browsers
      setIsSupported(true);
    }
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    setIsChecking(true);

    try {
      // Check if biometric authentication is available
      if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        
        if (!available) {
          toast.error('Biyometrik kimlik doğrulama bu cihazda desteklenmiyor');
          setIsChecking(false);
          return false;
        }
      }

      // Request biometric authentication using WebAuthn
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)), // Random challenge
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

      setIsChecking(false);
      return false;
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      // User cancelled or authentication failed
      if (error.name === 'NotAllowedError') {
        // User cancelled - don't show error, just return false
        setIsChecking(false);
        return false;
      } else if (error.name === 'NotSupportedError') {
        toast.error('Biyometrik kimlik doğrulama bu cihazda desteklenmiyor');
      } else {
        toast.error('Biyometrik kimlik doğrulama hatası');
      }
      
      setIsChecking(false);
      return false;
    }
  }, [isSupported]);

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
