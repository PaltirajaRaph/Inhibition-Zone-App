
import { Camera, CameraPermissionState } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export class CameraPermissions {
  static async checkAndRequest(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true; 
    }

    try {
      
      const permissions = await Camera.checkPermissions();

      if (permissions.camera === 'granted') {
        return true;
      }

      if (permissions.camera === 'denied') {
        toast.error('Camera Permission Required', {
          description: 'Please enable camera permission in device settings',
          duration: 5000,
        });
        return false;
      }

      
      const requested = await Camera.requestPermissions({ permissions: ['camera'] });

      if (requested.camera === 'granted') {
        toast.success('Camera Permission Granted', {
          description: 'Camera is now ready to use',
        });
        return true;
      } else {
        toast.error('Camera Permission Denied', {
          description: 'Camera permission is required for this feature',
        });
        return false;
      }
    } catch (error) {
      toast.error('Permission Error', {
        description: 'Failed to check camera permissions',
      });
      return false;
    }
  }

  static async getPermissionState(): Promise<CameraPermissionState> {
    if (!Capacitor.isNativePlatform()) {
      return 'granted';
    }

    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera;
    } catch (error) {
      return 'denied';
    }
  }

  static showPermissionInstructions() {
    toast.info('Enable Camera Permission', {
      description: 'Go to Settings > Apps > [App Name] > Permissions > Camera',
      duration: 8000,
    });
  }
}