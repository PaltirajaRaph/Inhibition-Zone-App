
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CameraPreview } from '@capacitor-community/camera-preview';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export interface CameraOptions {
  quality?: number;
  width?: number;
  height?: number;
}

export class CameraFallback {
  private static previewActive = false;

  static async capturePhoto(options: CameraOptions = {}): Promise<string | null> {
    const { quality = 90, width = 1024, height = 1024 } = options;

    
    if (this.previewActive && Capacitor.isNativePlatform()) {
      try {
        const result = await CameraPreview.capture({ quality });
        
        if (result?.value) {
          return `data:image/jpeg;base64,${result.value}`;
        }
      } catch (error) {
      }
    }

    // Strategy 2: Use Camera plugin
    try {
      const image = await Camera.getPhoto({
        quality,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true,
        width,
        height,
      });

      if (image.dataUrl) {
        return image.dataUrl;
      }
    } catch (error) {
    }

    return null;
  }

  static async startPreview(parentElement = 'camera-preview'): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      // Stop existing preview first
      if (this.previewActive) {
        await this.stopPreview();
      }

      await CameraPreview.start({
        position: 'rear',
        parent: parentElement,
        className: 'camera-preview-inner',
        toBack: false,
        enableZoom: true,
        enableOpacity: false,
        lockAndroidOrientation: true,
        width: window.innerWidth,
        height: Math.min(window.innerHeight * 0.7, 600),
      });

      this.previewActive = true;
      return true;
    } catch (error) {
      this.previewActive = false;
      return false;
    }
  }

  static async stopPreview(): Promise<void> {
    if (!this.previewActive) {
      return;
    }

    try {
      await CameraPreview.stop();
    } catch (error) {
    } finally {
      this.previewActive = false;
    }
  }

  static async setFlash(enabled: boolean): Promise<void> {
    if (!this.previewActive || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await CameraPreview.setFlashMode({
        flashMode: enabled ? 'torch' : 'off',
      });
    } catch (error) {
    }
  }

  static isPreviewActive(): boolean {
    return this.previewActive;
  }

  static async pickFromGallery(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        return image.dataUrl;
      }
    } catch (error) {
      toast.error('Gallery Error', {
        description: 'Failed to access gallery',
      });
    }

    return null;
  }
}