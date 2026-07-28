import { useMemo, useState, useRef, useEffect, useCallback, useId } from 'react';
import type { ReactNode } from 'react';
import type { AspectRatio, Preset, BorderSettings, ResizeSettings, OutputSettings } from '../types';
import { useCustomPresets } from '../hooks/useCustomPresets';
import { Chip, ChipGroup, cx } from './ui';
import { SECTION_HEADING } from './typography';
import { DEFAULT_GRADIENT_STOPS } from '../utils/constants';

interface PresetButtonsProps {
  currentBorder: BorderSettings;
  currentResize: ResizeSettings;
  currentOutput: OutputSettings;
  onApply: (border: BorderSettings, resize?: ResizeSettings, output?: OutputSettings, targetAspectRatio?: AspectRatio) => void;
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

/**
 * A sample of the IMAGE palette - the pigment that lands on the photograph -
 * shown inside a chrome control.
 *
 * It deliberately shares nothing with the chrome selection language. The frame
 * is a fixed mid neutral: it never becomes the accent hairline, never inherits
 * the chip's text colour (the old swatch used `border-current`, which let the
 * chrome bleed into the pigment), and does not change on hover, selection, or
 * theme. Selecting a preset changes the chip around this square; the square
 * itself is unaffected, which is what tells the user the two colour systems are
 * unrelated.
 *
 * Token note: the frame is `border-sample-frame`. It used to be `border-muted`,
 * borrowed because no token existed for the role - the rule colour is tuned to
 * disappear (that is a divider's job), so a #000000 sample framed in it is
 * invisible on a dark chip. The gap that comment flagged is now filled, and the
 * same token frames the two swatches in ControlPanel and TextOverlayControls
 * that were still on `border-border`. All three sit in one viewport.
 */
function ColorSample({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0 rounded-sm border border-sample-frame"
      style={{ backgroundColor: color }}
    />
  );
}

/** Quiet icon action attached to a custom preset chip. Never hover-only. */
function PresetIconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="cursor-pointer rounded-md p-2 text-muted transition-[background-color,color] duration-fast ease-out focus-visible:outline-2 focus-visible:outline-offset-2 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink"
    >
      {children}
    </button>
  );
}

export function PresetButtons({ currentBorder, currentResize, currentOutput, onApply }: PresetButtonsProps) {
  const { customPresets, savePreset, renamePreset, deletePreset } = useCustomPresets();
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  // This component renders twice - the desktop shelf and the mobile drawer - so
  // the heading ids a ChipGroup points at have to be unique per instance.
  const headingId = useId();

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

  const handleSave = useCallback(() => {
    const name = saveName.trim();
    if (!name) return;
    savePreset(name, currentBorder, currentResize, currentOutput);
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

  return (
    <div className="space-y-4">
      {/* Built-in presets */}
      <div>
        <h3 id={`${headingId}-quick`} className={cx('mb-2', SECTION_HEADING)}>
          Quick Presets
        </h3>
        <ChipGroup label="Quick presets" labelledBy={`${headingId}-quick`}>
          {DEFAULT_PRESETS.map((preset) => (
            <Chip
              key={preset.id}
              selected={isDefaultActive(preset)}
              onClick={() => onApply(preset.border)}
              title={preset.description}
              leading={<ColorSample color={preset.border.color} />}
            >
              {preset.name}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* Social media presets. These are action chips on purpose: applying one
          sets a target aspect ratio this component is never told about, so a
          set of six chips all reporting "not pressed" would be a lie. */}
      <div>
        <h3 id={`${headingId}-social`} className={cx('mb-2', SECTION_HEADING)}>
          Social
        </h3>
        <ChipGroup label="Social ratios" labelledBy={`${headingId}-social`}>
          {SOCIAL_PRESETS.map((preset) => (
            <Chip
              key={preset.id}
              onClick={() => onApply(SOCIAL_BORDER, undefined, undefined, preset.targetAspectRatio)}
              title={preset.description}
              // A chip caption takes text-micro, same as the font tags in
              // TextOverlayControls - the two read as one idiom and were split
              // between 11px and 12px for no reason.
              leading={<span className="text-micro text-muted">{preset.platform}</span>}
            >
              {/* Chrome voice, not data voice. `1:1` is the preset's NAME, and
                  `White 3%` one row above is the same field of the same type -
                  two names of the same kind cannot take two faces. The data voice
                  is for a value standing alone in its own element, which is why
                  the slider readouts and the hex fields keep it. */}
              {preset.name}
            </Chip>
          ))}
        </ChipGroup>
      </div>

      {/* Custom presets */}
      <div>
        {/* Not justify-between: on the desktop shelf this row is the full width
            of the app, which would strand the action a thousand pixels from the
            heading it belongs to. */}
        <div className="mb-2 flex items-center gap-3">
          <h3 id={`${headingId}-custom`} className={SECTION_HEADING}>
            My Presets
          </h3>
          {!showSaveInput && (
            <Chip
              onClick={() => setShowSaveInput(true)}
              title="Save current settings as a preset"
            >
              + Save current
            </Chip>
          )}
        </div>

        {showSaveInput && (
          <div className="mb-2 flex gap-2">
            <input
              ref={saveInputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={handleSaveKeyDown}
              placeholder="Preset name…"
              aria-label="Preset name"
              // Capped: this row is the full width of the desktop shelf, and a
              // 1100px field for a 40-character name is absurd. Still grows in
              // the mobile drawer, where the container is narrow.
              className="input min-w-0 flex-1 max-w-64"
              maxLength={40}
            />
            <button onClick={handleSave} disabled={!saveName.trim()} className="btn-secondary">
              Save
            </button>
            <button onClick={() => { setSaveName(''); setShowSaveInput(false); }} className="btn">
              Cancel
            </button>
          </div>
        )}

        {customPresets.length === 0 && !showSaveInput ? (
          <p className="text-xs italic text-muted">
            No saved presets yet. Click “Save current” to add one.
          </p>
        ) : (
          <ChipGroup label="My presets" labelledBy={`${headingId}-custom`}>
            {customPresets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-1">
                {renamingId === preset.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => handleRenameKeyDown(e, preset.id)}
                    onBlur={() => {
                      if (renameValue.trim()) {
                        renamePreset(preset.id, renameValue);
                      }
                      setRenamingId(null);
                    }}
                    aria-label={`Rename ${preset.name}`}
                    className="input w-32"
                    maxLength={40}
                  />
                ) : (
                  <Chip
                    selected={isCustomActive(preset)}
                    onClick={() => onApply(preset.border, preset.resize, preset.output)}
                    title={`Apply “${preset.name}” — border${preset.resize ? ' + resize' : ''}${preset.output ? ' + output' : ''}`}
                    leading={<ColorSample color={preset.border.color} />}
                  >
                    {preset.name}
                  </Chip>
                )}

                <PresetIconButton onClick={() => startRename(preset)} title={`Rename ${preset.name}`}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414A2 2 0 019.586 13z" />
                  </svg>
                </PresetIconButton>

                <PresetIconButton onClick={() => deletePreset(preset.id)} title={`Delete ${preset.name}`}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </PresetIconButton>
              </div>
            ))}
          </ChipGroup>
        )}
      </div>
    </div>
  );
}
