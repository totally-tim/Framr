import { memo, useId, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { AspectRatio, Preset, BorderSettings, ResizeSettings, OutputSettings, ToastVariant } from '../types';
import { useCustomPresets } from '../hooks/useCustomPresets';
import { DEFAULT_GRADIENT_STOPS } from '../utils/constants';

interface PresetButtonsProps {
  currentBorder: BorderSettings;
  currentResize: ResizeSettings;
  currentOutput: OutputSettings;
  onApply: (border: BorderSettings, resize?: ResizeSettings, output?: OutputSettings, targetAspectRatio?: AspectRatio) => void;
  onToast?: (message: string, variant?: ToastVariant) => void;
}

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'white-3',
    name: 'White 3%',
    border: { width: 3, widthUnit: '%', color: '#FFFFFF', aspectAware: false, borderMode: 'solid', gradientStops: DEFAULT_GRADIENT_STOPS, gradientAngle: 45 },
    description: 'Minimal white border',
  },
  {
    id: 'white-5',
    name: 'White 5%',
    border: { width: 5, widthUnit: '%', color: '#FFFFFF', aspectAware: false, borderMode: 'solid', gradientStops: DEFAULT_GRADIENT_STOPS, gradientAngle: 45 },
    description: 'Standard white border',
  },
  {
    id: 'white-10',
    name: 'White 10%',
    border: { width: 10, widthUnit: '%', color: '#FFFFFF', aspectAware: false, borderMode: 'solid', gradientStops: DEFAULT_GRADIENT_STOPS, gradientAngle: 45 },
    description: 'Prominent white border',
  },
  {
    id: 'black-3',
    name: 'Black 3%',
    border: { width: 3, widthUnit: '%', color: '#000000', aspectAware: false, borderMode: 'solid', gradientStops: DEFAULT_GRADIENT_STOPS, gradientAngle: 45 },
    description: 'Minimal black border',
  },
  {
    id: 'black-5',
    name: 'Black 5%',
    border: { width: 5, widthUnit: '%', color: '#000000', aspectAware: false, borderMode: 'solid', gradientStops: DEFAULT_GRADIENT_STOPS, gradientAngle: 45 },
    description: 'Standard black border',
  },
  {
    id: 'black-10',
    name: 'Black 10%',
    border: { width: 10, widthUnit: '%', color: '#000000', aspectAware: false, borderMode: 'solid', gradientStops: DEFAULT_GRADIENT_STOPS, gradientAngle: 45 },
    description: 'Prominent black border',
  },
];

const SOCIAL_BORDER: BorderSettings = {
  width: 0,
  widthUnit: 'px',
  color: '#FFFFFF',
  aspectAware: false,
  borderMode: 'solid',
  gradientStops: DEFAULT_GRADIENT_STOPS,
  gradientAngle: 45,
};

interface SocialPreset {
  id: string;
  name: string;
  platform: string;
  targetAspectRatio: AspectRatio;
  description: string;
}

const SOCIAL_PRESETS: SocialPreset[] = [
  { id: 'ig-square',    name: '1:1',  platform: 'Instagram',  targetAspectRatio: { width: 1, height: 1 },  description: 'Instagram square' },
  { id: 'ig-portrait',  name: '4:5',  platform: 'Instagram',  targetAspectRatio: { width: 4, height: 5 },  description: 'Instagram portrait' },
  { id: 'ig-photo',     name: '3:4',  platform: 'Instagram',  targetAspectRatio: { width: 3, height: 4 },  description: 'Instagram photo portrait' },
  { id: 'pinterest',    name: '2:3',  platform: 'Pinterest',  targetAspectRatio: { width: 2, height: 3 },  description: 'Pinterest vertical pin' },
  { id: 'twitter',      name: '16:9', platform: 'Twitter/X',  targetAspectRatio: { width: 16, height: 9 }, description: 'Twitter/X landscape' },
  { id: 'tiktok',       name: '9:16', platform: 'TikTok',     targetAspectRatio: { width: 9, height: 16 }, description: 'TikTok vertical' },
];

function PresetButtonsImpl({ currentBorder, currentResize, currentOutput, onApply, onToast }: PresetButtonsProps) {
  const handlePersistError = useCallback((err: Error) => {
    onToast?.(`Couldn't save preset — ${err.message}`, 'error');
  }, [onToast]);
  const { customPresets, savePreset, renamePreset, deletePreset } = useCustomPresets({
    onPersistError: handlePersistError,
  });
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSaveInput) saveInputRef.current?.focus();
  }, [showSaveInput]);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  const isDefaultActive = useMemo(() => {
    return (preset: Preset) =>
      preset.border.width === currentBorder.width &&
      preset.border.widthUnit === currentBorder.widthUnit &&
      preset.border.color === currentBorder.color &&
      preset.border.aspectAware === currentBorder.aspectAware &&
      preset.border.borderMode === currentBorder.borderMode;
  }, [currentBorder]);

  const isCustomActive = useMemo(() => {
    return (preset: Preset) => {
      if (!isDefaultActive(preset)) return false;
      if (preset.resize) {
        const r = preset.resize;
        if (
          r.enabled !== currentResize.enabled ||
          r.unit !== currentResize.unit ||
          r.maintainAspect !== currentResize.maintainAspect ||
          r.width !== currentResize.width ||
          r.height !== currentResize.height
        ) return false;
      }
      if (preset.output) {
        const o = preset.output;
        if (o.format !== currentOutput.format || o.quality !== currentOutput.quality) return false;
      }
      return true;
    };
  }, [currentResize, currentOutput, isDefaultActive]);

  const presetNameInputId = useId();

  const handleSave = useCallback(() => {
    const name = saveName.trim();
    if (!name) return;
    const saved = savePreset(name, currentBorder, currentResize, currentOutput);
    if (!saved) {
      // savePreset returned null (limit reached, empty name); leave the dialog
      // open so the user sees the toast and can adjust rather than thinking it
      // silently succeeded.
      return;
    }
    setSaveName('');
    setShowSaveInput(false);
  }, [saveName, currentBorder, currentResize, currentOutput, savePreset]);

  const handleSaveKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setSaveName(''); setShowSaveInput(false); }
  }, [handleSave]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      if (renameValue.trim()) renamePreset(id, renameValue);
      setRenamingId(null);
    }
    if (e.key === 'Escape') setRenamingId(null);
  }, [renameValue, renamePreset]);

  const startRename = useCallback((preset: Preset) => {
    setRenamingId(preset.id);
    setRenameValue(preset.name);
  }, []);

  const checkmark = (
    <svg className="w-3 h-3 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-mono text-2xs uppercase tracking-[0.2em] text-ink-100 dark:text-darkroom-500 mb-3">
          Quick Frames
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2" role="group" aria-label="Quick border presets">
          {DEFAULT_PRESETS.map((preset) => {
            const active = isDefaultActive(preset);
            const widthRatio = preset.border.width / 25;
            const isWhite = preset.border.color === '#FFFFFF';
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApply(preset.border)}
                className={`
                  group relative flex flex-col gap-1.5 p-1.5 transition-all
                  focus:outline-none border
                  ${active
                    ? 'border-ink-900 dark:border-paper-50 bg-paper-50 dark:bg-darkroom-200 shadow-print dark:shadow-print-dark'
                    : 'border-paper-300 dark:border-darkroom-300 bg-paper-50/50 dark:bg-darkroom-100/50 hover:border-ink-100 dark:hover:border-darkroom-500 hover:bg-paper-50 dark:hover:bg-darkroom-200'
                  }
                `}
                title={preset.description}
                aria-pressed={active}
                aria-label={`${preset.name} preset${active ? ', selected' : ''}`}
              >
                <div
                  className="relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: preset.border.color }}
                  aria-hidden="true"
                >
                  <div
                    className="absolute bg-gradient-to-br from-ink-100 via-safelight-400 to-ink-100"
                    style={{
                      inset: `${widthRatio * 22}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-mono text-2xs uppercase tracking-wider truncate ${active ? 'text-ink-900 dark:text-paper-50' : 'text-ink-600 dark:text-paper-100'}`}>
                    {preset.name}
                  </span>
                  {active && (
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isWhite ? 'bg-ink-900 dark:bg-paper-50' : 'bg-safelight-500'}`} aria-hidden="true" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-mono text-2xs uppercase tracking-[0.2em] text-ink-100 dark:text-darkroom-500 mb-3">
          Aspect Ratios
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2" role="group" aria-label="Social media aspect-ratio presets">
          {SOCIAL_PRESETS.map((preset) => {
            const aspectStyle = preset.targetAspectRatio.width / preset.targetAspectRatio.height;
            const w = aspectStyle >= 1 ? 32 : Math.round(32 * aspectStyle);
            const h = aspectStyle >= 1 ? Math.round(32 / aspectStyle) : 32;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApply(SOCIAL_BORDER, undefined, undefined, preset.targetAspectRatio)}
                className="group flex items-center gap-2 p-2 transition-all border border-paper-300 dark:border-darkroom-300 bg-paper-50/50 dark:bg-darkroom-100/50 hover:border-ink-100 dark:hover:border-darkroom-500 hover:bg-paper-50 dark:hover:bg-darkroom-200 focus:outline-none"
                title={preset.description}
                aria-label={`${preset.platform} ${preset.name}`}
              >
                <span
                  className="flex-shrink-0 border border-ink-600 dark:border-paper-100"
                  style={{ width: `${w}px`, height: `${h}px` }}
                  aria-hidden="true"
                />
                <span className="flex flex-col items-start min-w-0">
                  <span className="font-mono text-2xs uppercase tracking-wider text-ink-600 dark:text-paper-100">
                    {preset.name}
                  </span>
                  <span className="text-2xs text-ink-100 dark:text-darkroom-500 truncate">
                    {preset.platform}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono text-2xs uppercase tracking-[0.2em] text-ink-100 dark:text-darkroom-500">
            My Frames
          </h3>
          {!showSaveInput && (
            <button
              type="button"
              onClick={() => setShowSaveInput(true)}
              className="text-2xs font-mono uppercase tracking-wider px-2 py-1 text-safelight-700 dark:text-safelight-400 hover:bg-safelight-50 dark:hover:bg-safelight-700/10 transition-colors focus:outline-none"
              aria-label="Save current settings as a preset"
            >
              + Save current
            </button>
          )}
        </div>

        {showSaveInput && (
          <div className="flex gap-2 mb-2">
            <label htmlFor={presetNameInputId} className="sr-only">Preset name</label>
            <input
              id={presetNameInputId}
              ref={saveInputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={handleSaveKeyDown}
              placeholder="Preset name…"
              className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-safelight-500"
              maxLength={40}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="text-sm px-3 py-1.5 rounded-sm bg-ink-900 dark:bg-paper-50 text-paper-50 dark:text-ink-900 hover:bg-ink-600 dark:hover:bg-paper-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500 focus-visible:ring-offset-2"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setSaveName(''); setShowSaveInput(false); }}
              className="text-sm px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-safelight-500"
            >
              Cancel
            </button>
          </div>
        )}

        {customPresets.length === 0 && !showSaveInput ? (
          <p className="text-xs text-ink-100 dark:text-darkroom-500 italic font-serif">
            No saved frames yet. Click &quot;Save current&quot; to add one.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {customPresets.map((preset) => {
              const active = isCustomActive(preset);
              return (
                <div
                  key={preset.id}
                  className={`
                    flex items-center gap-1 pl-2.5 pr-1 py-1 text-sm border transition-all
                    ${active
                      ? 'bg-safelight-500 border-safelight-500 text-paper-50 shadow-print dark:shadow-print-dark'
                      : 'bg-paper-50/60 dark:bg-darkroom-200/60 border-safelight-400/40 dark:border-safelight-500/30 text-ink-900 dark:text-paper-50 hover:bg-safelight-50 dark:hover:bg-safelight-700/10'
                    }
                  `}
                >
                  {renamingId === preset.id ? (
                    <>
                      <label htmlFor={`rename-${preset.id}`} className="sr-only">Rename preset</label>
                      <input
                        id={`rename-${preset.id}`}
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => handleRenameKeyDown(e, preset.id)}
                        onBlur={() => {
                          if (renameValue.trim()) renamePreset(preset.id, renameValue);
                          setRenamingId(null);
                        }}
                        className="text-sm w-28 bg-transparent outline-none border-b border-current"
                        maxLength={40}
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onApply(preset.border, preset.resize, preset.output)}
                      className="flex items-center gap-1.5 min-h-[32px] focus:outline-none"
                      aria-label={`Apply preset ${preset.name}${active ? ', selected' : ''}`}
                      aria-pressed={active}
                      title={`Apply "${preset.name}"`}
                    >
                      {active && checkmark}
                      <span
                        className="w-3 h-3 border border-current opacity-70"
                        style={{ backgroundColor: preset.border.color }}
                        aria-hidden="true"
                      />
                      {preset.name}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => startRename(preset)}
                    className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity p-1.5 focus:outline-none"
                    aria-label={`Rename preset ${preset.name}`}
                    title="Rename"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414A2 2 0 019.586 13z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => deletePreset(preset.id)}
                    className="opacity-70 hover:opacity-100 transition-opacity p-1.5 focus:outline-none"
                    aria-label={`Delete preset ${preset.name}`}
                    title="Delete preset"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const PresetButtons = memo(PresetButtonsImpl);
