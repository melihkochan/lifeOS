import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Mail, Phone, Save, Loader2, X, Check, ZoomIn, ZoomOut, RotateCw, Move, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const ProfileSettings = ({ onBack }: { onBack: () => void }) => {
  const { t, language } = useTranslation();
  const { profile, updateProfile } = useAppStore();
  const { syncProfile } = useSupabaseData();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<{ file: File; preview: string; scale: number; position: { x: number; y: number }; rotation: number } | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resim boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setSelectedFile(file);
      // Reset transform values
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      // Clear any pending avatar when new image is selected
      setPendingAvatar(null);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel with non-passive listener
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container || !previewImage) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [previewImage]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3, prev + 0.2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.2));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const cropAndUploadImage = async (): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!previewImage || !selectedFile) {
        reject(new Error('No image selected'));
        return;
      }

      // Capture current state values
      const currentScale = scale;
      const currentPosition = position;
      const currentRotation = rotation;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to 400x400 (avatar size)
        const size = 400;
        canvas.width = size;
        canvas.height = size;

        // Calculate crop area - simpler approach
        // Container is 256x256, we want to crop a square from the center
        const containerSize = 256;
        
        // Calculate the scale factor between image and container
        const imageAspect = img.width / img.height;
        const containerAspect = 1; // square container
        
        let displayWidth, displayHeight;
        if (imageAspect > containerAspect) {
          // Image is wider - fit to height
          displayHeight = containerSize;
          displayWidth = containerSize * imageAspect;
        } else {
          // Image is taller - fit to width
          displayWidth = containerSize;
          displayHeight = containerSize / imageAspect;
        }
        
        // Apply user's scale
        const scaledDisplayWidth = displayWidth * currentScale;
        const scaledDisplayHeight = displayHeight * currentScale;
        
        // Calculate what portion of the scaled image is visible in the container
        const visibleWidth = Math.min(containerSize, scaledDisplayWidth);
        const visibleHeight = Math.min(containerSize, scaledDisplayHeight);
        
        // Calculate source crop size (in original image pixels)
        const sourceCropSize = Math.max(
          (visibleWidth / scaledDisplayWidth) * img.width,
          (visibleHeight / scaledDisplayHeight) * img.height
        );
        
        // Calculate source position (center of image, adjusted for user's position offset)
        const centerX = img.width / 2;
        const centerY = img.height / 2;
        
        // Convert position offset from container pixels to image pixels
        const offsetX = (currentPosition.x / containerSize) * (scaledDisplayWidth / currentScale);
        const offsetY = (currentPosition.y / containerSize) * (scaledDisplayHeight / currentScale);
        
        const sourceX = centerX - sourceCropSize / 2 - offsetX;
        const sourceY = centerY - sourceCropSize / 2 - offsetY;

        // Rotate if needed
        if (currentRotation !== 0) {
          ctx.save();
          ctx.translate(size / 2, size / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-size / 2, -size / 2);
        }

        // Draw cropped and transformed image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceCropSize,
          sourceCropSize,
          0,
          0,
          size,
          size
        );

        if (currentRotation !== 0) {
          ctx.restore();
        }

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], selectedFile.name, { type: selectedFile.type });
              resolve(file);
            } else {
              reject(new Error('Could not create blob'));
            }
          },
          selectedFile.type,
          0.9
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = previewImage;
    });
  };

  const handleConfirmUpload = () => {
    // Just confirm the preview, don't upload yet
    // The image will be uploaded when "Profili Kaydet" is clicked
    if (selectedFile && previewImage) {
      setPendingAvatar({
        file: selectedFile,
        preview: previewImage,
        scale,
        position,
        rotation,
      });
      setPreviewImage(null);
      setSelectedFile(null);
      toast.success(language === 'tr' ? 'Resim seçildi. "Profili Kaydet" butonuna basarak kaydedin.' : 'Image selected. Click "Save Profile" to save.');
    }
  };

  const handleCancelPreview = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setPendingAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatarClick = () => {
    setShowRemoveConfirm(true);
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    setShowRemoveConfirm(false);
    setUploading(true);
    try {
      // Delete from storage if exists
      if (profile.avatar) {
        try {
          const urlParts = profile.avatar.split('/avatars/');
          if (urlParts.length > 1) {
            const oldPath = urlParts[1];
            await supabase.storage.from('avatars').remove([oldPath]);
          }
        } catch (error) {
          console.warn('Could not delete old avatar from storage:', error);
        }
      }

      // Clear pending avatar if exists
      setPendingAvatar(null);

      // Update profile
      updateProfile({ avatar: undefined });
      
      // Sync to database
      await syncProfile();
      
      toast.success(language === 'tr' ? 'Profil resmi kaldırıldı!' : 'Avatar removed!');
    } catch (error: any) {
      console.error('Avatar remove error:', error);
      toast.error(language === 'tr' ? 'Resim kaldırılırken bir hata oluştu' : 'Error removing image');
    } finally {
      setUploading(false);
    }
  };

  const cropAndUploadImageFromPending = async (pending: { file: File; preview: string; scale: number; position: { x: number; y: number }; rotation: number }): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to 400x400 (avatar size)
        const size = 400;
        canvas.width = size;
        canvas.height = size;

        // Calculate crop area
        const containerSize = 256;
        const imageAspect = img.width / img.height;
        const containerAspect = 1;
        
        let displayWidth, displayHeight;
        if (imageAspect > containerAspect) {
          displayHeight = containerSize;
          displayWidth = containerSize * imageAspect;
        } else {
          displayWidth = containerSize;
          displayHeight = containerSize / imageAspect;
        }
        
        const scaledDisplayWidth = displayWidth * pending.scale;
        const scaledDisplayHeight = displayHeight * pending.scale;
        
        const visibleWidth = Math.min(containerSize, scaledDisplayWidth);
        const visibleHeight = Math.min(containerSize, scaledDisplayHeight);
        
        const sourceCropSize = Math.max(
          (visibleWidth / scaledDisplayWidth) * img.width,
          (visibleHeight / scaledDisplayHeight) * img.height
        );
        
        const centerX = img.width / 2;
        const centerY = img.height / 2;
        
        const offsetX = (pending.position.x / containerSize) * (scaledDisplayWidth / pending.scale);
        const offsetY = (pending.position.y / containerSize) * (scaledDisplayHeight / pending.scale);
        
        const sourceX = centerX - sourceCropSize / 2 - offsetX;
        const sourceY = centerY - sourceCropSize / 2 - offsetY;

        if (pending.rotation !== 0) {
          ctx.save();
          ctx.translate(size / 2, size / 2);
          ctx.rotate((pending.rotation * Math.PI) / 180);
          ctx.translate(-size / 2, -size / 2);
        }

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceCropSize,
          sourceCropSize,
          0,
          0,
          size,
          size
        );

        if (pending.rotation !== 0) {
          ctx.restore();
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], pending.file.name, { type: pending.file.type });
              resolve(file);
            } else {
              reject(new Error('Could not create blob'));
            }
          },
          pending.file.type,
          0.9
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = pending.preview;
    });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(language === 'tr' ? 'Lütfen tüm alanları doldurun' : 'Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(language === 'tr' ? 'Yeni şifreler eşleşmiyor' : 'New passwords do not match');
      return;
    }

    // Validate password requirements
    if (newPassword.length < 8) {
      toast.error(language === 'tr' ? 'Şifre en az 8 karakter olmalıdır' : 'Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error(language === 'tr' ? 'Şifre en az bir büyük harf içermelidir' : 'Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast.error(language === 'tr' ? 'Şifre en az bir küçük harf içermelidir' : 'Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error(language === 'tr' ? 'Şifre en az bir rakam içermelidir' : 'Password must contain at least one number');
      return;
    }

    setChangingPassword(true);
    try {
      // First, verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (verifyError) {
        toast.error(language === 'tr' ? 'Mevcut şifre hatalı' : 'Current password is incorrect');
        setChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success(language === 'tr' ? 'Şifre başarıyla değiştirildi!' : 'Password changed successfully!');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || (language === 'tr' ? 'Şifre değiştirilirken bir hata oluştu' : 'Error changing password'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // If there's a pending avatar (avatar preview was confirmed), upload it first
      if (pendingAvatar && user) {
        setUploading(true);
        try {
          // Crop and transform image
          const croppedFile = await cropAndUploadImageFromPending(pendingAvatar);

          // Delete old avatar if exists
          if (profile.avatar) {
            try {
              const urlParts = profile.avatar.split('/avatars/');
              if (urlParts.length > 1) {
                const oldPath = urlParts[1];
                await supabase.storage.from('avatars').remove([oldPath]);
              }
            } catch (error) {
              console.warn('Could not delete old avatar:', error);
            }
          }

          // Generate unique filename
          const fileExt = croppedFile.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, croppedFile, {
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          // Update profile with new avatar URL
          updateProfile({ avatar: publicUrl });
          
          // Clear pending avatar
          setPendingAvatar(null);
        } catch (error: any) {
          console.error('Avatar upload error:', error);
          toast.error(error.message || 'Resim yüklenirken bir hata oluştu');
          setUploading(false);
          setSaving(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // Sync profile (including avatar if uploaded)
      await syncProfile();
      toast.success(t.profileSaved);
    } catch (error) {
      toast.error('Profil kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };
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
        <h1 className="text-2xl font-bold">{t.profile}</h1>
        <p className="text-muted-foreground text-sm">{t.profileDesc}</p>
      </div>

      {/* Avatar */}
      <div className="flex justify-center">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-background">
            {previewImage ? (
              <AvatarImage src={previewImage} alt={profile.name || 'Avatar'} />
            ) : pendingAvatar?.preview ? (
              <AvatarImage src={pendingAvatar.preview} alt={profile.name || 'Avatar'} />
            ) : profile.avatar ? (
              <AvatarImage src={profile.avatar} alt={profile.name || 'Avatar'} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-3xl font-bold">
              {profile.name ? (
                profile.name.charAt(0).toUpperCase()
              ) : (
                <User className="w-12 h-12" />
              )}
            </AvatarFallback>
          </Avatar>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </motion.button>
          {(profile.avatar || pendingAvatar) && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRemoveAvatarClick}
              disabled={uploading}
              className="absolute top-0 right-0 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg disabled:opacity-50"
            >
              <X className="w-3 h-3" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Change Password Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowChangePassword(true)}
        className="widget w-full flex items-center gap-3 border border-primary/30"
      >
        <Lock className="w-5 h-5 text-primary" />
        <div className="flex-1 text-left">
          <p className="font-medium">{language === 'tr' ? 'Şifre Değiştir' : 'Change Password'}</p>
          <p className="text-xs text-muted-foreground">
            {language === 'tr' ? 'Hesap şifrenizi güncelleyin' : 'Update your account password'}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </motion.button>

      {/* Form */}
      <div className="space-y-4">
        <div className="widget">
          <label className="text-xs text-muted-foreground mb-2 block">{t.fullName}</label>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              placeholder={t.enterName}
              className="flex-1 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="widget">
          <label className="text-xs text-muted-foreground mb-2 block">{t.email}</label>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              value={profile.email}
              onChange={(e) => updateProfile({ email: e.target.value })}
              placeholder={t.enterEmail}
              className="flex-1 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="widget">
          <label className="text-xs text-muted-foreground mb-2 block">{t.phone}</label>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => updateProfile({ phone: e.target.value })}
              placeholder={t.enterPhone}
              className="flex-1 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {(saving || uploading) ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {uploading 
              ? (language === 'tr' ? 'Resim yükleniyor...' : 'Uploading image...')
              : (language === 'tr' ? 'Kaydediliyor...' : 'Saving...')
            }
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {t.saveProfile}
          </>
        )}
      </motion.button>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={handleCancelPreview}>
            <DialogContent className="sm:max-w-lg">
              <DialogTitle className="sr-only">
                {language === 'tr' ? 'Profil Resmi Önizleme' : 'Avatar Preview'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {language === 'tr' 
                  ? 'Resmi ayarlayın ve onaylayın' 
                  : 'Adjust and confirm the image'}
              </DialogDescription>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {language === 'tr' ? 'Profil Resmi Önizleme' : 'Avatar Preview'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'tr' 
                      ? 'Resmi sürükleyin, yakınlaştırın veya döndürün' 
                      : 'Drag, zoom, or rotate the image'}
                  </p>
                </div>
                
                {/* Image Container with Transform Controls */}
                <div className="flex justify-center">
                  <div 
                    ref={imageContainerRef}
                    className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ touchAction: 'none' }}
                  >
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover select-none"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                      }}
                      draggable={false}
                    />
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-2 justify-center">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleZoomOut}
                    className="p-2 bg-muted rounded-lg hover:bg-muted/80"
                    title={language === 'tr' ? 'Uzaklaştır' : 'Zoom Out'}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleZoomIn}
                    className="p-2 bg-muted rounded-lg hover:bg-muted/80"
                    title={language === 'tr' ? 'Yakınlaştır' : 'Zoom In'}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRotate}
                    className="p-2 bg-muted rounded-lg hover:bg-muted/80"
                    title={language === 'tr' ? 'Döndür' : 'Rotate'}
                  >
                    <RotateCw className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleReset}
                    className="p-2 bg-muted rounded-lg hover:bg-muted/80"
                    title={language === 'tr' ? 'Sıfırla' : 'Reset'}
                  >
                    <Move className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelPreview}
                    className="flex-1 py-3 bg-muted text-foreground rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    {language === 'tr' ? 'İptal' : 'Cancel'}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirmUpload}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {language === 'tr' ? 'Onayla' : 'Confirm'}
                  </motion.button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Remove Avatar Confirmation Dialog */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'tr' ? 'Profil Resmini Kaldır' : 'Remove Avatar'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'tr' 
                ? 'Profil resminizi kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.'
                : 'Are you sure you want to remove your profile picture? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'tr' ? 'İptal' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAvatar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'tr' ? 'Kaldır' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">
            {language === 'tr' ? 'Şifre Değiştir' : 'Change Password'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === 'tr' ? 'Hesap şifrenizi güncelleyin' : 'Update your account password'}
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {language === 'tr' ? 'Şifre Değiştir' : 'Change Password'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'tr' 
                  ? 'Güvenliğiniz için mevcut şifrenizi girin ve yeni şifre belirleyin'
                  : 'Enter your current password and set a new password for security'}
              </p>
            </div>

            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                {language === 'tr' ? 'Mevcut Şifre' : 'Current Password'}
              </label>
              <div className="relative">
                <div className="flex items-center gap-3 widget">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={language === 'tr' ? 'Mevcut şifrenizi girin' : 'Enter current password'}
                    className="flex-1 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                {language === 'tr' ? 'Yeni Şifre' : 'New Password'}
              </label>
              <div className="relative">
                <div className="flex items-center gap-3 widget">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === 'tr' ? 'Yeni şifrenizi girin' : 'Enter new password'}
                    className="flex-1 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                {language === 'tr' ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <div className="flex items-center gap-3 widget">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={language === 'tr' ? 'Yeni şifrenizi tekrar girin' : 'Confirm new password'}
                    className="flex-1 bg-transparent focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleChangePassword();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium mb-1">
                  {language === 'tr' ? 'Şifre Gereksinimleri:' : 'Password Requirements:'}
                </p>
                <ul className="space-y-0.5 pl-4">
                  <li className={newPassword.length >= 8 ? 'text-success' : ''}>
                    {language === 'tr' ? '• En az 8 karakter' : '• At least 8 characters'}
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? 'text-success' : ''}>
                    {language === 'tr' ? '• En az bir büyük harf' : '• At least one uppercase letter'}
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? 'text-success' : ''}>
                    {language === 'tr' ? '• En az bir küçük harf' : '• At least one lowercase letter'}
                  </li>
                  <li className={/[0-9]/.test(newPassword) ? 'text-success' : ''}>
                    {language === 'tr' ? '• En az bir rakam' : '• At least one number'}
                  </li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 py-3 bg-muted text-foreground rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                {language === 'tr' ? 'İptal' : 'Cancel'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === 'tr' ? 'Değiştiriliyor...' : 'Changing...'}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {language === 'tr' ? 'Değiştir' : 'Change'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
