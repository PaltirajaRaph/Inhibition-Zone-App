import { registerPlugin } from '@capacitor/core';


export interface CustomCameraPlugin {
  
  startCamera(): Promise<{ success: boolean; message: string }>;

  
  takePicture(): Promise<{ success: boolean; path: string; uri: string }>;

  
  setFlashMode(options: { mode: 'on' | 'off' | 'auto' }): Promise<{ 
    success: boolean; 
    flashMode: string 
  }>;

  
  setTorchEnabled(options: { enabled: boolean }): Promise<{ 
    success: boolean; 
    torchEnabled: boolean 
  }>;

  
  setZoomRatio(options: { ratio: number }): Promise<{ 
    success: boolean; 
    zoomRatio: number;
    minZoomRatio: number;
    maxZoomRatio: number;
  }>;

  
  getCameraInfo(): Promise<{
    hasFlashUnit: boolean;
    minZoomRatio: number;
    maxZoomRatio: number;
    currentZoomRatio: number;
  }>;

  
  stopCamera(): Promise<{ success: boolean; message: string }>;

  
  launchNewAnalysis(): Promise<{ 
    success: boolean; 
    uri?: string;
    message?: string;
  }>;
}

const CustomCamera = registerPlugin<CustomCameraPlugin>('CustomCamera');

export default CustomCamera;
