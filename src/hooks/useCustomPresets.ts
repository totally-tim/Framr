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
  // Track the last value we know is in storage so the persist effect can
  // skip echo-writes (after a cross-tab storage event) without skipping
  // genuine local edits. A simple flag-based "skip next write" would also
  // suppress the next legitimate save if a local mutation lands before the
  // storage-sync's effect runs.
  const lastWrittenJsonRef = useRef<string | undefined>(undefined);
  const onPersistErrorRef = useRef(options.onPersistError);
  useEffect(() => { onPersistErrorRef.current = options.onPersistError; }, [options.onPersistError]);

  // Synchronous mirror of the in-flight count. The capacity gate reads + bumps
  // this ref atomically before queuing setCustomPresets, so two rapid saves
  // can't both pass a stale closure check (and React 19's deferred scheduling
  // doesn't let us observe setter side-effects synchronously).
  const inFlightCountRef = useRef(customPresets.length);
  useEffect(() => { inFlightCountRef.current = customPresets.length; }, [customPresets.length]);

  // Persist on change. The first commit just snapshots — initial state already
  // came from storage, so there's nothing to write yet.
  useEffect(() => {
    const json = JSON.stringify(customPresets);
    if (lastWrittenJsonRef.current === undefined) {
      lastWrittenJsonRef.current = json;
      return;
    }
    if (json === lastWrittenJsonRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, json);
      lastWrittenJsonRef.current = json;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save preset');
      console.warn('Framr: failed to write custom presets', error);
      onPersistErrorRef.current?.(error);
    }
  }, [customPresets]);

  // Multi-tab sync. Note: removeItem/clear in another tab fires a storage event
  // with newValue === null — we must reload (loadFromStorage returns []) rather
  // than skip, otherwise cross-tab deletions never propagate. We update
  // lastWrittenJsonRef to the synced snapshot so the next persist effect
  // recognizes it as already-in-storage and skips the echo-write.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY && e.key !== null) return;
      const fresh = loadFromStorage();
      lastWrittenJsonRef.current = JSON.stringify(fresh);
      setCustomPresets(fresh);
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
      // Atomic check + bump on the ref — single-threaded JS guarantees no two
      // savePreset calls race here, so two rapid clicks can never both pass.
      if (inFlightCountRef.current >= MAX_PRESET_COUNT) {
        const error = new Error(`Preset limit reached (${MAX_PRESET_COUNT}). Delete one to save another.`);
        console.warn('Framr:', error.message);
        onPersistErrorRef.current?.(error);
        return null;
      }
      inFlightCountRef.current += 1;
      const preset: Preset = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: trimmed,
        border,
        resize,
        output,
        isCustom: true,
      };
      setCustomPresets((prev) => [...prev, preset]);
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
    setCustomPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      // Mirror the deletion in the in-flight count ref synchronously — the
      // sync-from-state effect only runs after React commits, and a
      // savePreset between delete and commit would otherwise see the ref
      // still at MAX and falsely reject.
      if (next.length !== prev.length) {
        inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
      }
      return next;
    });
  }, []);

  return { customPresets, savePreset, renamePreset, deletePreset };
}
