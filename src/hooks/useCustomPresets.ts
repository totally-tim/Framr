import { useState, useCallback } from 'react';
import type { Preset, BorderSettings, ResizeSettings, OutputSettings } from '../types';

const STORAGE_KEY = 'framr-custom-presets';

function loadFromStorage(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is Preset =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        typeof p.border === 'object' &&
        p.border !== null &&
        typeof p.border.width === 'number' &&
        typeof p.border.widthUnit === 'string' &&
        typeof p.border.color === 'string' &&
        typeof p.border.aspectAware === 'boolean'
    ).map((p) => ({
      ...p,
      border: {
        ...p.border,
        borderMode: p.border.borderMode ?? 'solid',
        gradientAngle: p.border.gradientAngle ?? 45,
        gradientStops: (p.border.gradientStops ?? []).map((s: { id?: string; color: string; position: number }, i: number) => ({
          id: s.id ?? `migrated-${p.id}-${i}`,
          color: s.color,
          position: s.position,
        })),
      },
    }));
  } catch {
    return [];
  }
}

function saveToStorage(presets: Preset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function useCustomPresets() {
  const [customPresets, setCustomPresets] = useState<Preset[]>(loadFromStorage);

  const savePreset = useCallback(
    (
      name: string,
      border: BorderSettings,
      resize: ResizeSettings,
      output: OutputSettings
    ): Preset => {
      const preset: Preset = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        border,
        resize,
        output,
        isCustom: true,
      };
      setCustomPresets((prev) => {
        const updated = [...prev, preset];
        saveToStorage(updated);
        return updated;
      });
      return preset;
    },
    []
  );

  const renamePreset = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomPresets((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, name: trimmed } : p
      );
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const deletePreset = useCallback((id: string) => {
    setCustomPresets((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return { customPresets, savePreset, renamePreset, deletePreset };
}
