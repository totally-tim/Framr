import type { BorderSettings, GradientStop } from '../types';

let _stopCounter = 0;

export function createGradientStop(color: string, position: number): GradientStop {
  return {
    id: `stop-${Date.now()}-${++_stopCounter}`,
    color,
    position,
  };
}

export const DEFAULT_GRADIENT_STOPS: GradientStop[] = [
  { id: 'default-stop-0', color: '#FFFFFF', position: 0 },
  { id: 'default-stop-1', color: '#000000', position: 100 },
];

export const DEFAULT_BORDER_SETTINGS: BorderSettings = {
  width: 5,
  widthUnit: '%',
  color: '#FFFFFF',
  aspectAware: false,
  borderMode: 'solid',
  gradientStops: DEFAULT_GRADIENT_STOPS,
  gradientAngle: 45,
};
