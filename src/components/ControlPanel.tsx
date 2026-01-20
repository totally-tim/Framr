import { useState, useCallback } from 'react';
import type { BorderSettings, ResizeSettings, OutputSettings } from '../types';
import { PRESET_COLORS, isValidHex, normalizeHex } from '../utils/colorUtils';

interface ControlPanelProps {
  borderSettings: BorderSettings;
  resizeSettings: ResizeSettings;
  outputSettings: OutputSettings;
  onBorderChange: (settings: BorderSettings) => void;
  onResizeChange: (settings: ResizeSettings) => void;
  onOutputChange: (settings: OutputSettings) => void;
}

export function ControlPanel({
  borderSettings,
  resizeSettings,
  outputSettings,
  onBorderChange,
  onResizeChange,
  onOutputChange,
}: ControlPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [colorInput, setColorInput] = useState(borderSettings.color);

  const handleWidthChange = useCallback((value: number) => {
    onBorderChange({ ...borderSettings, width: value });
  }, [borderSettings, onBorderChange]);

  const handleColorChange = useCallback((color: string) => {
    setColorInput(color);
    if (isValidHex(color)) {
      onBorderChange({ ...borderSettings, color: normalizeHex(color) });
    }
  }, [borderSettings, onBorderChange]);

  const handleColorInputBlur = useCallback(() => {
    if (isValidHex(colorInput)) {
      const normalized = normalizeHex(colorInput);
      setColorInput(normalized);
      onBorderChange({ ...borderSettings, color: normalized });
    } else {
      setColorInput(borderSettings.color);
    }
  }, [colorInput, borderSettings, onBorderChange]);

  const handlePresetColorClick = useCallback((color: string) => {
    setColorInput(color);
    onBorderChange({ ...borderSettings, color });
  }, [borderSettings, onBorderChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wider">
          Border
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600 dark:text-gray-300">Width</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={borderSettings.width}
                onChange={(e) => handleWidthChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 px-2 py-1 text-sm text-right rounded border bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                max={borderSettings.widthUnit === '%' ? 50 : 1000}
              />
              <span className="text-sm text-gray-500 w-6">
                {borderSettings.widthUnit}
              </span>
            </div>
          </div>

          <input
            type="range"
            value={borderSettings.width}
            onChange={(e) => handleWidthChange(parseInt(e.target.value))}
            className="slider w-full"
            min={0}
            max={borderSettings.widthUnit === '%' ? 25 : 500}
            step={borderSettings.widthUnit === '%' ? 1 : 10}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm text-gray-600 dark:text-gray-300">Color</label>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={borderSettings.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={colorInput}
              onChange={(e) => handleColorChange(e.target.value)}
              onBlur={handleColorInputBlur}
              className="flex-1 px-3 py-2 text-sm rounded border bg-white dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#FFFFFF"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetColorClick(preset.value)}
                className={`
                  w-7 h-7 rounded border-2 transition-all
                  ${borderSettings.color === preset.value
                    ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                    : 'hover:scale-110'
                  }
                `}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
                aria-label={preset.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span>Advanced Settings</span>
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">Width Unit</label>
              <div className="flex rounded-lg overflow-hidden border">
                {(['%', 'px'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => onBorderChange({ ...borderSettings, widthUnit: unit })}
                    className={`
                      flex-1 py-2 text-sm font-medium transition-colors
                      ${borderSettings.widthUnit === unit
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Aspect-aware borders
              </label>
              <button
                onClick={() => onBorderChange({ ...borderSettings, aspectAware: !borderSettings.aspectAware })}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${borderSettings.aspectAware ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${borderSettings.aspectAware ? 'translate-x-5' : ''}
                  `}
                />
              </button>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Resize before border
                </label>
                <button
                  onClick={() => onResizeChange({ ...resizeSettings, enabled: !resizeSettings.enabled })}
                  className={`
                    relative w-11 h-6 rounded-full transition-colors
                    ${resizeSettings.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                      ${resizeSettings.enabled ? 'translate-x-5' : ''}
                    `}
                  />
                </button>
              </div>

              {resizeSettings.enabled && (
                <div className="space-y-3 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Width</label>
                      <input
                        type="number"
                        value={resizeSettings.width || ''}
                        onChange={(e) => onResizeChange({
                          ...resizeSettings,
                          width: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="w-full mt-1 px-2 py-1.5 text-sm rounded border bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Auto"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Height</label>
                      <input
                        type="number"
                        value={resizeSettings.height || ''}
                        onChange={(e) => onResizeChange({
                          ...resizeSettings,
                          height: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="w-full mt-1 px-2 py-1.5 text-sm rounded border bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Auto"
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Unit</span>
                    <div className="flex rounded overflow-hidden border">
                      {(['px', '%'] as const).map((unit) => (
                        <button
                          key={unit}
                          onClick={() => onResizeChange({ ...resizeSettings, unit })}
                          className={`
                            px-3 py-1 text-xs font-medium transition-colors
                            ${resizeSettings.unit === unit
                              ? 'bg-blue-500 text-white'
                              : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Maintain aspect ratio</span>
                    <button
                      onClick={() => onResizeChange({ ...resizeSettings, maintainAspect: !resizeSettings.maintainAspect })}
                      className={`
                        relative w-9 h-5 rounded-full transition-colors
                        ${resizeSettings.maintainAspect ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                      `}
                    >
                      <span
                        className={`
                          absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform
                          ${resizeSettings.maintainAspect ? 'translate-x-4' : ''}
                        `}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Output</h4>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Format</label>
                <select
                  value={outputSettings.format}
                  onChange={(e) => onOutputChange({ ...outputSettings, format: e.target.value as OutputSettings['format'] })}
                  className="w-full px-3 py-2 text-sm rounded border bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="original">Same as input</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              {(outputSettings.format === 'jpeg' || outputSettings.format === 'webp' || outputSettings.format === 'original') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Quality (JPEG/WebP)</label>
                    <span className="text-xs text-gray-600 dark:text-gray-300">{outputSettings.quality}%</span>
                  </div>
                  <input
                    type="range"
                    value={outputSettings.quality}
                    onChange={(e) => onOutputChange({ ...outputSettings, quality: parseInt(e.target.value) })}
                    className="slider w-full"
                    min={1}
                    max={100}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
