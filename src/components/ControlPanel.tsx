import { useState, useCallback, useId, useRef } from 'react';
import type { BorderSettings, BorderMode, ResizeSettings, OutputSettings, CanvasBackground, TextOverlaySettings } from '../types';
import { PRESET_COLORS, CANVAS_BACKGROUND_COLORS, isValidHex, normalizeHex } from '../utils/colorUtils';
import { GRADIENT_PRESETS, gradientToCss } from '../utils/gradientUtils';
import { createGradientStop } from '../utils/constants';
import { TextOverlayControls } from './TextOverlayControls';
import { useMountThroughExit } from './motion';
import { Segment, Switch, cx } from './ui';
import type { SegmentOption } from './ui';
import { SECTION_HEADING, ACCORDION_TRIGGER } from './typography';

const BORDER_MODE_OPTIONS: readonly SegmentOption<BorderMode>[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'linear-gradient', label: 'Linear' },
  { value: 'radial-gradient', label: 'Radial' },
];

const UNIT_OPTIONS: readonly SegmentOption<'px' | '%'>[] = [
  { value: '%', label: '%', ariaLabel: 'Percent' },
  { value: 'px', label: 'px', ariaLabel: 'Pixels' },
];

interface SwatchProps {
  /** Any CSS background value - a hex colour or a gradient. */
  fill: string;
  name: string;
  onClick: () => void;
  /** Omit entirely for a swatch that applies a value but never reads as active. */
  selected?: boolean;
}

/**
 * A colour or gradient sample the user applies to the image.
 *
 * The four primitives in `./ui` do not cover this: a swatch's payload is the
 * colour itself, so it cannot take a surface fill the way a Chip does. The
 * chassis instead wraps the sample in a padded control that carries the chrome
 * treatment - selection is `bg-surface-selected` + `border-accent-hairline` on
 * the wrapper, exactly the language the primitives use, and the sample inside is
 * untouched. `hover:scale-110` is gone; hover raises the wrapper's surface.
 */
function Swatch({ fill, name, onClick, selected }: SwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={name}
      aria-label={name}
      aria-pressed={typeof selected === 'boolean' ? selected : undefined}
      className={cx(
        'flex size-8 flex-none cursor-pointer items-center justify-center rounded-md border p-0.5',
        // Enumerated, and `outline` is absent: the focus ring is never inside a
        // transition. `transition-colors` would include outline-color in v4.
        'transition-[background-color,border-color] duration-fast ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        selected
          ? 'border-accent-hairline bg-surface-selected'
          : cx(
              'border-transparent bg-transparent',
              '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover',
            ),
      )}
    >
      {/* The sample. `border-sample-frame`, not `border-border`: the fill here is
          image-palette pigment, so the frame is the only thing standing between a
          #FFFFFF sample and light chrome, or a #000000 one and dark chrome. The
          rule colour is tuned to disappear and cannot do that job. The wrapper
          above is a control and keeps the control outline. */}
      <span
        aria-hidden="true"
        className="size-full rounded-sm border border-sample-frame"
        style={{ background: fill }}
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

export function ControlPanel({
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
  const id = useId();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const advancedRef = useRef<HTMLDivElement>(null);
  const advanced = useMountThroughExit(showAdvanced, advancedRef);
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className={SECTION_HEADING}>Border</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`${id}-border-width`} className="text-sm text-ink">Width</label>
            <div className="flex items-center gap-2">
              <input
                id={`${id}-border-width`}
                type="number"
                value={borderSettings.width}
                onChange={(e) => handleWidthChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="input data-voice w-16 text-right"
                min={0}
                max={borderSettings.widthUnit === '%' ? 50 : 1000}
              />
              <span className="data-voice w-6 text-xs text-muted">
                {borderSettings.widthUnit}
              </span>
            </div>
          </div>

          {/* Direct manipulation: one-to-one with the pointer, no transition. */}
          <input
            type="range"
            aria-label="Border width"
            value={borderSettings.width}
            onChange={(e) => handleWidthChange(parseInt(e.target.value))}
            className="slider w-full"
            min={0}
            max={borderSettings.widthUnit === '%' ? 25 : 500}
            step={borderSettings.widthUnit === '%' ? 1 : 10}
          />
        </div>

        {/* Border mode selector */}
        <div className="space-y-2">
          <span id={`${id}-border-style`} className="block text-sm text-ink">Style</span>
          <Segment
            value={borderSettings.borderMode}
            options={BORDER_MODE_OPTIONS}
            onChange={(borderMode) => onBorderChange({ ...borderSettings, borderMode })}
            label="Border style"
            labelledBy={`${id}-border-style`}
          />
        </div>

        {/* Solid color controls */}
        {!isGradient && (
          <div className="space-y-3">
            <label htmlFor={`${id}-border-hex`} className="block text-sm text-ink">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Border color picker"
                value={borderSettings.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="size-10 flex-none cursor-pointer rounded-md border border-border"
              />
              <input
                id={`${id}-border-hex`}
                type="text"
                value={colorInput}
                onChange={(e) => handleColorChange(e.target.value)}
                onBlur={handleColorInputBlur}
                className="input data-voice flex-1"
                placeholder="#FFFFFF"
              />
            </div>
            {/* Grid, not flex-wrap: the eight swatches plus 8px gaps overflow the
                287px sidebar by 25px, which orphans the last one onto its own row.
                An eight-column grid divides the available width instead. */}
            <div role="group" aria-label="Border color presets" className="grid grid-cols-8 gap-1">
              {PRESET_COLORS.map((preset) => (
                <Swatch
                  key={preset.value}
                  fill={preset.value}
                  name={preset.name}
                  selected={borderSettings.color === preset.value}
                  onClick={() => handlePresetColorClick(preset.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Gradient controls */}
        {isGradient && (
          <div className="space-y-3">
            {/* Live gradient preview strip */}
            <div
              aria-hidden="true"
              className="h-8 rounded-md border border-border"
              style={{ background: gradientToCss(borderSettings) }}
            />

            {/* Gradient presets */}
            <div className="space-y-2">
              <span id={`${id}-gradient-presets`} className="block text-sm text-ink">Presets</span>
              <div
                role="group"
                aria-labelledby={`${id}-gradient-presets`}
                className="flex flex-wrap gap-2"
              >
                {GRADIENT_PRESETS.filter((p) => p.mode === borderSettings.borderMode).map((preset) => (
                  <Swatch
                    key={preset.id}
                    name={preset.name}
                    fill={
                      preset.mode === 'linear-gradient'
                        ? `linear-gradient(${preset.angle}deg, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(', ')})`
                        : `radial-gradient(circle, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(', ')})`
                    }
                    onClick={() => onBorderChange({
                      ...borderSettings,
                      gradientStops: preset.stops,
                      gradientAngle: preset.angle,
                    })}
                  />
                ))}
              </div>
            </div>

            {/* Angle slider (linear only) */}
            {borderSettings.borderMode === 'linear-gradient' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span id={`${id}-gradient-angle`} className="text-sm text-ink">Angle</span>
                  <span className="data-voice text-xs text-muted">{borderSettings.gradientAngle}&deg;</span>
                </div>
                <input
                  type="range"
                  aria-labelledby={`${id}-gradient-angle`}
                  value={borderSettings.gradientAngle}
                  onChange={(e) => onBorderChange({ ...borderSettings, gradientAngle: parseInt(e.target.value) })}
                  className="slider w-full"
                  min={0}
                  max={360}
                  step={1}
                />
              </div>
            )}

            {/* Color stops editor */}
            <div className="space-y-2">
              <span className="block text-sm text-ink">Color Stops</span>
              {borderSettings.gradientStops.map((stop, idx) => (
                <div key={stop.id} className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`Color stop ${idx + 1} color`}
                    value={stop.color}
                    onChange={(e) => {
                      const stops = borderSettings.gradientStops.map((s, i) =>
                        i === idx ? { ...s, color: e.target.value } : s
                      );
                      onBorderChange({ ...borderSettings, gradientStops: stops });
                    }}
                    className="size-8 flex-none cursor-pointer rounded-md border border-border"
                  />
                  <input
                    type="range"
                    aria-label={`Color stop ${idx + 1} position`}
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
                  <span className="data-voice w-8 text-right text-xs text-muted">{stop.position}%</span>
                  {borderSettings.gradientStops.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const stops = borderSettings.gradientStops.filter((_, i) => i !== idx);
                        onBorderChange({ ...borderSettings, gradientStops: stops });
                      }}
                      className={cx(
                        'flex-none cursor-pointer rounded-sm text-muted',
                        'transition-[color] duration-fast ease-out',
                        'focus-visible:outline-2 focus-visible:outline-offset-2',
                        '[@media(hover:hover)_and_(pointer:fine)]:hover:text-danger',
                      )}
                      title="Remove stop"
                      aria-label={`Remove color stop ${idx + 1}`}
                    >
                      <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {borderSettings.gradientStops.length < 5 && (
                <button
                  type="button"
                  onClick={() => {
                    const stops = [...borderSettings.gradientStops, createGradientStop('#888888', 50)];
                    onBorderChange({ ...borderSettings, gradientStops: stops });
                  }}
                  className="btn"
                >
                  + Add stop
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className={SECTION_HEADING}>Canvas Background</h3>

        <div className="flex items-center justify-between gap-2">
          <span id={`${id}-checkerboard`} className="text-sm text-ink">Checkerboard</span>
          <Switch
            checked={canvasBackground.mode === 'checkerboard'}
            onChange={handleCanvasBgModeToggle}
            label="Checkerboard background"
            labelledBy={`${id}-checkerboard`}
          />
        </div>

        {canvasBackground.mode === 'solid' && (
          <div className="space-y-3">
            <label htmlFor={`${id}-canvas-hex`} className="block text-sm text-ink">Color</label>

            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Canvas background color picker"
                value={canvasBackground.color}
                onChange={(e) => handleCanvasBgColorChange(e.target.value)}
                className="size-10 flex-none cursor-pointer rounded-md border border-border"
              />
              <input
                id={`${id}-canvas-hex`}
                type="text"
                value={canvasBgInput}
                onChange={(e) => handleCanvasBgColorChange(e.target.value)}
                onBlur={handleCanvasBgInputBlur}
                className="input data-voice flex-1"
                placeholder="#808080"
              />
            </div>

            <div role="group" aria-label="Canvas background presets" className="flex flex-wrap gap-2">
              {CANVAS_BACKGROUND_COLORS.map((preset) => (
                <Swatch
                  key={preset.value}
                  fill={preset.value}
                  name={preset.name}
                  selected={canvasBackground.color === preset.value}
                  onClick={() => handleCanvasBgPresetClick(preset.value)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <TextOverlayControls
        textOverlay={textOverlay}
        onChange={onTextOverlayChange}
        exifDate={exifDate}
      />

      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-controls={`${id}-advanced`}
          className={ACCORDION_TRIGGER}
        >
          <span>Advanced Settings</span>
          <svg
            aria-hidden="true"
            className={cx(
              'size-4 flex-none text-muted transition-[rotate] duration-fast ease-out',
              showAdvanced && 'rotate-180',
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* The accordion animates `grid-template-rows: 0fr -> 1fr`, never height:
            the panel's height is not known until it is open, and a grid track
            interpolates between the two on its own. The content stays mounted
            through the exit, which is the whole reason there is an exit at all.
            Under reduced motion the global block drops grid-template-rows from
            the list, so the height lands on the first frame while the fade still
            runs - travel removed, state change still perceivable. */}
        {advanced.mounted && (
          <div
            ref={advancedRef}
            id={`${id}-advanced`}
            inert={!showAdvanced}
            className={cx(
              'grid transition-[grid-template-rows,opacity]',
              advanced.shown
                ? 'grid-rows-[1fr] opacity-100 duration-enter ease-out'
                : 'grid-rows-[0fr] opacity-0 duration-exit ease-in',
            )}
          >
            {/* `min-h-0` lets the track actually shrink the content. The clip is
                dropped once the entrance finishes, or it would cut the focus
                ring off every control in here for as long as the panel is open. */}
            <div className={cx('min-h-0', !advanced.settled && 'overflow-hidden')}>
              {/* The margin belongs INSIDE the collapsing track. On the wrapper it
                  would survive the collapse and leave a 16px gap behind. */}
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <span id={`${id}-width-unit`} className="block text-sm text-ink">Width Unit</span>
                  <Segment
                    value={borderSettings.widthUnit}
                    options={UNIT_OPTIONS}
                    onChange={(widthUnit) => onBorderChange({ ...borderSettings, widthUnit })}
                    label="Border width unit"
                    labelledBy={`${id}-width-unit`}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span id={`${id}-aspect-aware`} className="text-sm text-ink">
                    Aspect-aware borders
                  </span>
                  <Switch
                    checked={borderSettings.aspectAware}
                    onChange={(aspectAware) => onBorderChange({ ...borderSettings, aspectAware })}
                    label="Aspect-aware borders"
                    labelledBy={`${id}-aspect-aware`}
                  />
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span id={`${id}-resize-enabled`} className="text-sm text-ink">
                      Resize before border
                    </span>
                    <Switch
                      checked={resizeSettings.enabled}
                      onChange={(enabled) => onResizeChange({ ...resizeSettings, enabled })}
                      label="Resize before border"
                      labelledBy={`${id}-resize-enabled`}
                    />
                  </div>

                  {resizeSettings.enabled && (
                    <div className="space-y-3 border-l-2 border-border pl-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor={`${id}-resize-width`} className="block text-sm text-ink">Width</label>
                          <input
                            id={`${id}-resize-width`}
                            type="number"
                            value={resizeSettings.width || ''}
                            onChange={(e) => onResizeChange({
                              ...resizeSettings,
                              width: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                            className="input data-voice mt-1"
                            placeholder="Auto"
                            min={1}
                          />
                        </div>
                        <div>
                          <label htmlFor={`${id}-resize-height`} className="block text-sm text-ink">Height</label>
                          <input
                            id={`${id}-resize-height`}
                            type="number"
                            value={resizeSettings.height || ''}
                            onChange={(e) => onResizeChange({
                              ...resizeSettings,
                              height: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                            className="input data-voice mt-1"
                            placeholder="Auto"
                            min={1}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span id={`${id}-resize-unit`} className="text-sm text-ink">Unit</span>
                        <Segment
                          value={resizeSettings.unit}
                          options={UNIT_OPTIONS}
                          onChange={(unit) => onResizeChange({ ...resizeSettings, unit })}
                          label="Resize unit"
                          labelledBy={`${id}-resize-unit`}
                          width="hug"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span id={`${id}-maintain-aspect`} className="text-sm text-ink">Maintain aspect ratio</span>
                        <Switch
                          checked={resizeSettings.maintainAspect}
                          onChange={(maintainAspect) => onResizeChange({ ...resizeSettings, maintainAspect })}
                          label="Maintain aspect ratio"
                          labelledBy={`${id}-maintain-aspect`}
                          size="sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className={SECTION_HEADING}>Output</h4>

                  <div className="space-y-2">
                    <label htmlFor={`${id}-format`} className="block text-sm text-ink">Format</label>
                    <select
                      id={`${id}-format`}
                      value={outputSettings.format}
                      onChange={(e) => onOutputChange({ ...outputSettings, format: e.target.value as OutputSettings['format'] })}
                      className="input"
                    >
                      <option value="original">Same as input</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>

                  {(outputSettings.format === 'jpeg' || outputSettings.format === 'webp' || outputSettings.format === 'original') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span id={`${id}-quality`} className="text-sm text-ink">Quality (JPEG/WebP)</span>
                        <span className="data-voice text-xs text-muted">{outputSettings.quality}%</span>
                      </div>
                      <input
                        type="range"
                        aria-labelledby={`${id}-quality`}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
