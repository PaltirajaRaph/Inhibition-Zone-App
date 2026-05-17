import { WebPlugin } from '@capacitor/core';
import type { CustomCameraPlugin } from './CustomCamera';


export class CustomCameraWeb extends WebPlugin implements CustomCameraPlugin {
  async startCamera(): Promise<{ success: boolean; message: string }> {
    console.warn('CustomCamera plugin is not available on web');
    return { 
      success: false, 
      message: 'Camera plugin only available on native platforms' 
    };
  }

  async takePicture(): Promise<{ success: boolean; path: string; uri: string }> {
    throw new Error('takePicture not available on web. Use Capacitor Camera plugin instead.');
  }

  async setFlashMode(): Promise<{ success: boolean; flashMode: string }> {
    return { success: false, flashMode: 'off' };
  }

  async setTorchEnabled(): Promise<{ success: boolean; torchEnabled: boolean }> {
    return { success: false, torchEnabled: false };
  }

  async setZoomRatio(): Promise<{ 
    success: boolean; 
    zoomRatio: number;
    minZoomRatio: number;
    maxZoomRatio: number;
  }> {
    return { 
      success: false, 
      zoomRatio: 1.0,
      minZoomRatio: 1.0,
      maxZoomRatio: 1.0
    };
  }

  async getCameraInfo(): Promise<{
    hasFlashUnit: boolean;
    minZoomRatio: number;
    maxZoomRatio: number;
    currentZoomRatio: number;
  }> {
    return {
      hasFlashUnit: false,
      minZoomRatio: 1.0,
      maxZoomRatio: 1.0,
      currentZoomRatio: 1.0
    };
  }

  async stopCamera(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'No camera to stop on web' };
  }

  async launchNewAnalysis(): Promise<{ 
    success: boolean; 
    uri?: string; 
    message?: string; 
  }> {
    return { success: false, message: 'launchNewAnalysis not available on web' };
  }
}
