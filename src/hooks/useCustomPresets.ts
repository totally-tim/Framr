import { useState, useCallback, useEffect, useRef } from 'react';
import type { Preset, BorderSettings, ResizeSettings, OutputSettings, GradientStop, BorderMode } from '../types';

const STORAGE_KEY = 'framr-custom-presets';
const MAX_NAME_LENGTH = 40;
const MAX_PRESET_COUNT = 100;

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

const VALID_MODES: BorderMode[] = ['solid', 'linear-gradient', 'radial-gradient'];
const VALID_UNITS = ['px', '%'] as const;

function sanitizeStop(s: unknown, presetId: string, i: number): GradientStop | null {
  if (typeof s !== 'object' || s === null) return null;
  const stop = s as Partial<GradientStop>;
  if (!isHexColor(stop.color)) return null;
  if (typeof stop.position !== 'number' || !Number.isFinite(stop.position)) return null;
  return {
    id: typeof stop.id === 'string' && stop.id ? stop.id : `migrated-${presetId}-${i}`,
    color: stop.color,
    position: clamp(stop.position, 0, 100),
  };
}

function sanitizePreset(raw: unknown): Preset | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;

  if (typeof p.id !== 'string' || !p.id) return null;
  if (typeof p.name !== 'string' || !p.name) return null;
  const border = p.border as Record<string, unknown> | null | undefined;
  if (!border || typeof border !== 'object') return null;

  if (typeof border.width !== 'number' || !Number.isFinite(border.width)) return null;
  if (!VALID_UNITS.includes(border.widthUnit as 'px' | '%')) return null;
  if (!isHexColor(border.color)) return null;
  if (typeof border.aspectAware !== 'boolean') return null;

  const borderMode: BorderMode = VALID_MODES.includes(border.borderMode as BorderMode)
    ? (border.borderMode as BorderMode)
    : 'solid';

  const gradientAngle = typeof border.gradientAngle === 'number' && Number.isFinite(border.gradientAngle)
    ? clamp(border.gradientAngle, 0, 360)
    : 45;

  const rawStops = Array.isArray(border.gradientStops) ? border.gradientStops : [];
  const gradientStops = rawStops
    .map((s, i) => sanitizeStop(s, p.id as string, i))
    .filter((s): s is GradientStop => s !== null);

  const sanitized: Preset = {
    id: p.id,
    name: (p.name as string).trim().slice(0, MAX_NAME_LENGTH),
    border: {
      width: clamp(border.width, 0, 1000),
      widthUnit: border.widthUnit as 'px' | '%',
      color: border.color as string,
      aspectAware: border.aspectAware,
      borderMode,
      gradientAngle,
      gradientStops,
    },
    isCustom: true,
  };

  // Preserve optional resize/output blocks if they exist and look well-formed.
  if (p.resize && typeof p.resize === 'object') {
    sanitized.resize = p.resize as ResizeSettings;
  }
  if (p.output && typeof p.output === 'object') {
    sanitized.output = p.output as OutputSettings;
  }

  return sanitized;
}

function loadFromStorage(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizePreset)
      .filter((p): p is Preset => p !== null)
      .slice(0, MAX_PRESET_COUNT);
  } catch (err) {
    console.warn('Framr: failed to read custom presets from storage', err);
    return [];
  }
}

export interface UseCustomPresetsOptions {
  /** Called when localStorage persistence fails (e.g. QuotaExceededError). */
  onPersistError?: (error: Error) => void;
}

export interface UseCustomPresetsApi {
  customPresets: Preset[];
  savePreset: (
    name: string,
    border: BorderSettings,
    resize: ResizeSettings,
    output: OutputSettings,
  ) => Preset | null;
  renamePreset: (id: string, name: string) => void;
  deletePreset: (id: string) => void;
}

export function useCustomPresets(options: UseCustomPresetsOptions = {}): UseCustomPresetsApi {
  const [customPresets, setCustomPresets] = useState<Preset[]>(loadFromStorage);
  const skipNextWrite = useRef(true); // skip first save (we just read from storage)
  const onPersistErrorRef = useRef(options.onPersistError);
  useEffect(() => { onPersistErrorRef.current = options.onPersistError; }, [options.onPersistError]);

  // Persist on change.
  useEffect(() => {
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save preset');
      console.warn('Framr: failed to write custom presets', error);
      onPersistErrorRef.current?.(error);
    }
  }, [customPresets]);

  // Multi-tab sync.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      skipNextWrite.current = true;
      setCustomPresets(loadFromStorage());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const savePreset = useCallback(
    (
      name: string,
      border: BorderSettings,
      resize: ResizeSettings,
      output: OutputSettings,
    ): Preset | null => {
      const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
      if (!trimmed) return null;
      const preset: Preset = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: trimmed,
        border,
        resize,
        output,
        isCustom: true,
      };
      setCustomPresets((prev) => {
        if (prev.length >= MAX_PRESET_COUNT) return prev;
        return [...prev, preset];
      });
      return preset;
    },
    [],
  );

  const renamePreset = useCallback((id: string, name: string) => {
    const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
    if (!trimmed) return;
    setCustomPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
    );
  }, []);

  const deletePreset = useCallback((id: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { customPresets, savePreset, renamePreset, deletePreset };
}
