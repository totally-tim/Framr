export interface ImageFile {
  id: string;
  file: File;
  name: string;
  originalWidth: number;
  originalHeight: number;
  thumbnailUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  processedBlob?: Blob;
  error?: string;
}

export interface BorderSettings {
  width: number;
  widthUnit: 'px' | '%';
  color: string;
  aspectAware: boolean;
}

export interface ResizeSettings {
  enabled: boolean;
  width?: number;
  height?: number;
  unit: 'px' | '%';
  maintainAspect: boolean;
}

export interface OutputSettings {
  format: 'original' | 'jpeg' | 'png' | 'webp';
  quality: number;
}

export interface ProcessingConfig {
  border: BorderSettings;
  resize: ResizeSettings;
  output: OutputSettings;
}

export interface Preset {
  id: string;
  name: string;
  border: BorderSettings;
  description?: string;
}

export interface ProcessingResult {
  imageId: string;
  blob: Blob;
  filename: string;
}

export type CanvasBackgroundMode = 'checkerboard' | 'solid';

export interface CanvasBackground {
  mode: CanvasBackgroundMode;
  color: string;
}

export interface WorkerMessage {
  type: 'process';
  imageData: ImageData;
  config: ProcessingConfig;
  originalFormat: string;
  filename: string;
  imageId: string;
}

export interface WorkerResponse {
  type: 'result' | 'error' | 'progress';
  imageId: string;
  blob?: Blob;
  filename?: string;
  error?: string;
  progress?: number;
}

export type PreviewMode = 'processed' | 'original' | 'side-by-side' | 'slider';
