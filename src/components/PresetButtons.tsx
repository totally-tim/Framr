import { useMemo, useState, useRef, useEffect } from 'react';
import type { Preset, BorderSettings, ResizeSettings, OutputSettings } from '../types';
import { useCustomPresets } from '../hooks/useCustomPresets';

interface PresetButtonsProps {
  currentBorder: BorderSettings;
  currentResize: ResizeSettings;
  currentOutput: OutputSettings;
  onApply: (border: BorderSettings, resize?: ResizeSettings, output?: OutputSettings) => void;
}

const DEFAULT_GRADIENT_STOPS = [
  { color: '#FFFFFF', position: 0 },
  { color: '#000000', position: 100 },
];

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

export function PresetButtons({ currentBorder, currentResize, currentOutput, onApply }: PresetButtonsProps) {
  const { customPresets, savePreset, renamePreset, deletePreset } = useCustomPresets();
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
      preset.border.aspectAware === currentBorder.aspectAware;
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
  }, [currentBorder, currentResize, currentOutput, isDefaultActive]);

  function handleSave() {
    const name = saveName.trim();
    if (!name) return;
    savePreset(name, currentBorder, currentResize, currentOutput);
    setSaveName('');
    setShowSaveInput(false);
  }

  function handleSaveKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setSaveName(''); setShowSaveInput(false); }
  }

  function handleRenameKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Enter') {
      renamePreset(id, renameValue);
      setRenamingId(null);
    }
    if (e.key === 'Escape') setRenamingId(null);
  }

  function startRename(preset: Preset) {
    setRenamingId(preset.id);
    setRenameValue(preset.name);
  }

  return (
    <div className="space-y-3">
      {/* Built-in presets */}
      <div>
        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-2">
          Quick Presets
        </h3>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApply(preset.border)}
              className={`
                px-3 py-1.5 text-sm rounded-lg transition-all
                ${isDefaultActive(preset)
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
              title={preset.description}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: preset.border.color }}
                />
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wider">
            My Presets
          </h3>
          {!showSaveInput && (
            <button
              onClick={() => setShowSaveInput(true)}
              className="text-xs px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              title="Save current settings as a preset"
            >
              + Save current
            </button>
          )}
        </div>

        {showSaveInput && (
          <div className="flex gap-2 mb-2">
            <input
              ref={saveInputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={handleSaveKeyDown}
              placeholder="Preset name…"
              className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={40}
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setSaveName(''); setShowSaveInput(false); }}
              className="text-sm px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {customPresets.length === 0 && !showSaveInput ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            No saved presets yet. Click &quot;Save current&quot; to add one.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {customPresets.map((preset) => (
              <div
                key={preset.id}
                className={`
                  flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg text-sm border transition-all
                  ${isCustomActive(preset)
                    ? 'bg-violet-500 border-violet-500 text-white shadow-md'
                    : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40'
                  }
                `}
              >
                {renamingId === preset.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => handleRenameKeyDown(e, preset.id)}
                    onBlur={() => { renamePreset(preset.id, renameValue); setRenamingId(null); }}
                    className="text-sm w-28 bg-transparent outline-none border-b border-current"
                    maxLength={40}
                  />
                ) : (
                  <button
                    onClick={() => onApply(preset.border, preset.resize, preset.output)}
                    className="flex items-center gap-1.5"
                    title={`Apply "${preset.name}" — border${preset.resize ? ' + resize' : ''}${preset.output ? ' + output' : ''}`}
                  >
                    <span
                      className="w-3 h-3 rounded-sm border border-current opacity-70"
                      style={{ backgroundColor: preset.border.color }}
                    />
                    {preset.name}
                  </button>
                )}

                {/* Rename button */}
                <button
                  onClick={() => startRename(preset)}
                  className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
                  title="Rename"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414A2 2 0 019.586 13z" />
                  </svg>
                </button>

                {/* Delete button */}
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
                  title="Delete preset"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
