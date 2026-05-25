import { memo, useId, useMemo, useState, useCallback } from 'react';
import type { BorderSettings, BorderMode, ResizeSettings, OutputSettings, CanvasBackground, TextOverlaySettings } from '../types';
import { PRESET_COLORS, CANVAS_BACKGROUND_COLORS, isValidHex, normalizeHex } from '../utils/colorUtils';
import { GRADIENT_PRESETS, gradientToCss } from '../utils/gradientUtils';
import { createGradientStop } from '../utils/constants';
import { TextOverlayControls } from './TextOverlayControls';

interface SwitchToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: 'sm' | 'md';
}

function SwitchToggle({ checked, onChange, label, size = 'md' }: SwitchToggleProps) {
  const dims = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
  const thumb = size === 'sm' ? 'w-4 h-4 top-0.5 left-0.5' : 'w-4 h-4 top-1 left-1';
  const translate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative ${dims} rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span
        className={`absolute ${thumb} bg-white rounded-full transition-transform ${checked ? translate : ''}`}
        aria-hidden="true"
      />
    </button>
  );
}

interface ControlPanelProps {
  borderSettings: BorderSettings;
  resizeSettings: ResizeSettings;
  outputSettings: OutputSettings;
  canvasBackground: CanvasBackground;
  textOverlay: TextOverlaySettings;
  exifDate?: Date;
  onBorderChange: (settings: BorderSettings) => void;
  onResizeChange: (settings: ResizeSettings) => void;
  onOutputChange: (settings: OutputSettings) => void;
  onCanvasBackgroundChange: (settings: CanvasBackground) => void;
  onTextOverlayChange: (settings: TextOverlaySettings) => void;
}

function ControlPanelImpl({
  borderSettings,
  resizeSettings,
  outputSettings,
  canvasBackground,
  textOverlay,
  exifDate,
  onBorderChange,
  onResizeChange,
  onOutputChange,
  onCanvasBackgroundChange,
  onTextOverlayChange,
}: ControlPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [colorInput, setColorInput] = useState(borderSettings.color);
  const [prevBorderColor, setPrevBorderColor] = useState(borderSettings.color);
  if (borderSettings.color !== prevBorderColor) {
    setPrevBorderColor(borderSettings.color);
    setColorInput(borderSettings.color);
  }

  const [canvasBgInput, setCanvasBgInput] = useState(canvasBackground.color);
  const [prevCanvasBgColor, setPrevCanvasBgColor] = useState(canvasBackground.color);
  if (canvasBackground.color !== prevCanvasBgColor) {
    setPrevCanvasBgColor(canvasBackground.color);
    setCanvasBgInput(canvasBackground.color);
  }

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

  const handleCanvasBgColorChange = useCallback((color: string) => {
    setCanvasBgInput(color);
    if (isValidHex(color)) {
      onCanvasBackgroundChange({ ...canvasBackground, color: normalizeHex(color) });
    }
  }, [canvasBackground, onCanvasBackgroundChange]);

  const handleCanvasBgInputBlur = useCallback(() => {
    if (isValidHex(canvasBgInput)) {
      const normalized = normalizeHex(canvasBgInput);
      setCanvasBgInput(normalized);
      onCanvasBackgroundChange({ ...canvasBackground, color: normalized });
    } else {
      setCanvasBgInput(canvasBackground.color);
    }
  }, [canvasBgInput, canvasBackground, onCanvasBackgroundChange]);

  const handleCanvasBgPresetClick = useCallback((color: string) => {
    setCanvasBgInput(color);
    onCanvasBackgroundChange({ ...canvasBackground, color });
  }, [canvasBackground, onCanvasBackgroundChange]);

  const handleCanvasBgModeToggle = useCallback(() => {
    onCanvasBackgroundChange({
      ...canvasBackground,
      mode: canvasBackground.mode === 'checkerboard' ? 'solid' : 'checkerboard',
    });
  }, [canvasBackground, onCanvasBackgroundChange]);

  const isGradient = borderSettings.borderMode === 'linear-gradient' || borderSettings.borderMode === 'radial-gradient';

  const widthInputId = useId();
  const widthSliderId = useId();
  const resizeWidthId = useId();
  const resizeHeightId = useId();
  const formatId = useId();
  const qualityId = useId();
  const colorHexId = useId();
  const canvasBgHexId = useId();
  const gradientAngleId = useId();
  const gradientPreviewCss = useMemo(() => gradientToCss(borderSettings), [borderSettings]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wider">
          Border
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 dark:text-gray-200" htmlFor={widthInputId}>Width</label>
            <div className="flex items-center gap-2">
              <input
                id={widthInputId}
                type="number"
                value={borderSettings.width}
                onChange={(e) => handleWidthChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 px-2 py-1 text-sm text-right rounded border bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                max={borderSettings.widthUnit === '%' ? 50 : 1000}
                aria-label="Border width"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300 w-6" aria-hidden="true">
                {borderSettings.widthUnit}
              </span>
            </div>
          </div>

          <input
            id={widthSliderId}
            type="range"
            value={borderSettings.width}
            onChange={(e) => handleWidthChange(parseInt(e.target.value))}
            className="slider w-full"
            min={0}
            max={borderSettings.widthUnit === '%' ? 25 : 500}
            step={borderSettings.widthUnit === '%' ? 1 : 10}
            aria-label="Border width"
            aria-valuetext={`${borderSettings.width}${borderSettings.widthUnit}`}
          />
        </div>

        {/* Border mode selector */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Style</label>
          <div className="flex rounded-lg overflow-hidden border">
            {(['solid', 'linear-gradient', 'radial-gradient'] as BorderMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onBorderChange({ ...borderSettings, borderMode: mode })}
                className={`
                  flex-1 py-1.5 text-xs font-medium transition-colors
                  ${borderSettings.borderMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {mode === 'solid' ? 'Solid' : mode === 'linear-gradient' ? 'Linear' : 'Radial'}
              </button>
            ))}
          </div>
        </div>

        {/* Solid color controls */}
        {!isGradient && (
          <div className="space-y-3">
            <label htmlFor={colorHexId} className="text-sm text-gray-700 dark:text-gray-200">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={borderSettings.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-11 h-11 rounded border cursor-pointer"
                aria-label="Border color picker"
              />
              <input
                id={colorHexId}
                type="text"
                value={colorInput}
                onChange={(e) => handleColorChange(e.target.value)}
                onBlur={handleColorInputBlur}
                className="flex-1 px-3 py-2 text-sm rounded border bg-white dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#FFFFFF"
                aria-label="Border color hex value"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Preset border colors">
              {PRESET_COLORS.map((preset) => {
                const active = borderSettings.color === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetColorClick(preset.value)}
                    className={`
                      relative w-9 h-9 rounded border-2 transition-all
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                      ${active
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                        : 'hover:scale-110'
                      }
                    `}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    aria-label={`${preset.name}${active ? ', selected' : ''}`}
                    aria-pressed={active}
                  >
                    {active && (
                      <svg
                        className={`absolute inset-0 m-auto w-4 h-4 ${preset.value.toLowerCase() === '#ffffff' || preset.value.toLowerCase() === '#fff' ? 'text-gray-900' : 'text-white'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Gradient controls */}
        {isGradient && (
          <div className="space-y-3">
            {/* Live gradient preview strip */}
            <div
              className="h-8 rounded border"
              style={{ background: gradientPreviewCss }}
              aria-hidden="true"
            />

            {/* Gradient presets */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {GRADIENT_PRESETS.filter((p) => p.mode === borderSettings.borderMode).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onBorderChange({
                      ...borderSettings,
                      gradientStops: preset.stops,
                      gradientAngle: preset.angle,
                    })}
                    className="w-8 h-8 rounded border-2 hover:scale-110 transition-all border-gray-300 dark:border-gray-600"
                    style={{
                      background: preset.mode === 'linear-gradient'
                        ? `linear-gradient(${preset.angle}deg, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(', ')})`
                        : `radial-gradient(circle, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(', ')})`,
                    }}
                    title={preset.name}
                    aria-label={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Angle slider (linear only) */}
            {borderSettings.borderMode === 'linear-gradient' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor={gradientAngleId} className="text-xs text-gray-600 dark:text-gray-300">Angle</label>
                  <span className="text-xs text-gray-700 dark:text-gray-200" aria-hidden="true">{borderSettings.gradientAngle}°</span>
                </div>
                <input
                  id={gradientAngleId}
                  type="range"
                  value={borderSettings.gradientAngle}
                  onChange={(e) => onBorderChange({ ...borderSettings, gradientAngle: parseInt(e.target.value) })}
                  className="slider w-full"
                  min={0}
                  max={360}
                  step={1}
                  aria-label="Gradient angle"
                  aria-valuetext={`${borderSettings.gradientAngle} degrees`}
                />
              </div>
            )}

            {/* Color stops editor */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Color Stops</label>
              {borderSettings.gradientStops.map((stop, idx) => (
                <div key={stop.id} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => {
                      const stops = borderSettings.gradientStops.map((s, i) =>
                        i === idx ? { ...s, color: e.target.value } : s
                      );
                      onBorderChange({ ...borderSettings, gradientStops: stops });
                    }}
                    className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="range"
                    value={stop.position}
                    onChange={(e) => {
                      const stops = borderSettings.gradientStops.map((s, i) =>
                        i === idx ? { ...s, position: parseInt(e.target.value) } : s
                      );
                      onBorderChange({ ...borderSettings, gradientStops: stops });
                    }}
                    className="slider flex-1"
                    min={0}
                    max={100}
                    step={1}
                  />
                  <span className="text-xs text-gray-500 w-8 text-right">{stop.position}%</span>
                  {borderSettings.gradientStops.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const stops = borderSettings.gradientStops.filter((_, i) => i !== idx);
                        onBorderChange({ ...borderSettings, gradientStops: stops });
                      }}
                      className="p-2 min-w-[36px] min-h-[36px] text-gray-500 dark:text-gray-400 hover:text-red-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                      aria-label={`Remove color stop ${idx + 1}`}
                      title="Remove stop"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {borderSettings.gradientStops.length < 5 && (
                <button
                  onClick={() => {
                    const stops = [...borderSettings.gradientStops, createGradientStop('#888888', 50)];
                    onBorderChange({ ...borderSettings, gradientStops: stops });
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  + Add stop
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wider">
          Canvas Background
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-200">Checkerboard</span>
          <SwitchToggle
            checked={canvasBackground.mode === 'checkerboard'}
            onChange={handleCanvasBgModeToggle}
            label="Show checkerboard background behind the preview canvas"
          />
        </div>

        {canvasBackground.mode === 'solid' && (
          <div className="space-y-3">
            <label htmlFor={canvasBgHexId} className="text-sm text-gray-700 dark:text-gray-200">Color</label>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={canvasBackground.color}
                onChange={(e) => handleCanvasBgColorChange(e.target.value)}
                className="w-11 h-11 rounded border cursor-pointer"
                aria-label="Canvas background color picker"
              />
              <input
                id={canvasBgHexId}
                type="text"
                value={canvasBgInput}
                onChange={(e) => handleCanvasBgColorChange(e.target.value)}
                onBlur={handleCanvasBgInputBlur}
                className="flex-1 px-3 py-2 text-sm rounded border bg-white dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#808080"
                aria-label="Canvas background hex value"
              />
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Canvas background presets">
              {CANVAS_BACKGROUND_COLORS.map((preset) => {
                const active = canvasBackground.color === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleCanvasBgPresetClick(preset.value)}
                    className={`
                      w-9 h-9 rounded border-2 transition-all
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                      ${active
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                        : 'hover:scale-110'
                      }
                    `}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                    aria-label={`${preset.name}${active ? ', selected' : ''}`}
                    aria-pressed={active}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <TextOverlayControls
        textOverlay={textOverlay}
        onChange={onTextOverlayChange}
        exifDate={exifDate}
      />

      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-controls="advanced-settings-region"
          className="flex items-center justify-between w-full py-2 min-h-[44px] text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded"
        >
          <span>Advanced Settings</span>
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div id="advanced-settings-region" className="mt-4 space-y-4">
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

            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-200 block">
                  Aspect-aware borders
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Pad the short axis more for a balanced frame
                </span>
              </div>
              <SwitchToggle
                checked={borderSettings.aspectAware}
                onChange={() => onBorderChange({ ...borderSettings, aspectAware: !borderSettings.aspectAware })}
                label="Aspect-aware borders — thicker borders on the short axis"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  Resize before border
                </span>
                <SwitchToggle
                  checked={resizeSettings.enabled}
                  onChange={() => onResizeChange({ ...resizeSettings, enabled: !resizeSettings.enabled })}
                  label="Resize the image before adding a border"
                />
              </div>

              {resizeSettings.enabled && (
                <div className="space-y-3 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={resizeWidthId} className="text-xs text-gray-600 dark:text-gray-300">Width</label>
                      <input
                        id={resizeWidthId}
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
                      <label htmlFor={resizeHeightId} className="text-xs text-gray-600 dark:text-gray-300">Height</label>
                      <input
                        id={resizeHeightId}
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
                    <span className="text-gray-700 dark:text-gray-200">Maintain aspect ratio</span>
                    <SwitchToggle
                      size="sm"
                      checked={resizeSettings.maintainAspect}
                      onChange={() => onResizeChange({ ...resizeSettings, maintainAspect: !resizeSettings.maintainAspect })}
                      label="Maintain aspect ratio when resizing"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Output</h4>

              <div className="space-y-2">
                <label htmlFor={formatId} className="text-xs text-gray-600 dark:text-gray-300">Format</label>
                <select
                  id={formatId}
                  value={outputSettings.format}
                  onChange={(e) => onOutputChange({ ...outputSettings, format: e.target.value as OutputSettings['format'] })}
                  className="w-full px-3 py-2 text-sm rounded border bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="original">Same as input</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  TIFF inputs are saved as PNG (browser limitation). Metadata is stripped during processing.
                </p>
              </div>

              {(outputSettings.format === 'jpeg' || outputSettings.format === 'webp' || outputSettings.format === 'original') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor={qualityId} className="text-xs text-gray-600 dark:text-gray-300">Quality (JPEG/WebP)</label>
                    <span className="text-xs text-gray-700 dark:text-gray-200" aria-hidden="true">{outputSettings.quality}%</span>
                  </div>
                  <input
                    id={qualityId}
                    type="range"
                    value={outputSettings.quality}
                    onChange={(e) => onOutputChange({ ...outputSettings, quality: parseInt(e.target.value) })}
                    className="slider w-full"
                    min={1}
                    max={100}
                    aria-label="Output quality"
                    aria-valuetext={`${outputSettings.quality} percent`}
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

export const ControlPanel = memo(ControlPanelImpl);
