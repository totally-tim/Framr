import { useState, useCallback, useRef, useEffect, useId } from 'react';
import type { ReactNode } from 'react';
import type { TextOverlaySettings, FontMeta, DateStampFormat, TextEffect } from '../types';
import {
  CURATED_FONTS,
  ALL_FONTS,
  FONT_CATEGORIES,
  FILM_CAMERA_PRESET,
  getFontMeta,
  loadFont,
  getRecentFonts,
  addRecentFont,
  isGenericFont,
} from '../utils/fonts';
import type { FontCategory } from '../utils/fonts';
import { TEXT_COLOR_PRESETS, isValidHex, normalizeHex } from '../utils/colorUtils';
import { DATE_STAMP_FORMATS, formatDateStamp } from '../utils/dateFormat';
import { useMountThroughExit } from './motion';
import { Chip, ChipGroup, PositionGrid, Segment, Switch, cx } from './ui';
import type { SegmentOption } from './ui';
import { ACCORDION_TRIGGER, MICRO_LABEL } from './typography';

interface TextOverlayControlsProps {
  textOverlay: TextOverlaySettings;
  onChange: (settings: TextOverlaySettings) => void;
  exifDate?: Date;
}

const FONT_CATEGORY_OPTIONS: readonly SegmentOption<FontCategory>[] = FONT_CATEGORIES.map(
  (category) => ({ value: category.value, label: category.label }),
);

const TEXT_EFFECT_OPTIONS: readonly SegmentOption<TextEffect>[] = [
  { value: 'none', label: 'None' },
  { value: 'glow', label: 'Glow' },
  { value: 'film-burn', label: 'Film Burn' },
];

export function TextOverlayControls({ textOverlay, onChange, exifDate }: TextOverlayControlsProps) {
  const [showSection, setShowSection] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const section = useMountThroughExit(showSection, sectionRef);
  const [overlayColorInput, setOverlayColorInput] = useState(textOverlay.color);
  const [shadowColorInput, setShadowColorInput] = useState(textOverlay.textShadow.color);
  const [fontCategory, setFontCategory] = useState<FontCategory>('all');
  const [showDateFormat, setShowDateFormat] = useState(false);
  const [recentFonts, setRecentFonts] = useState<string[]>(getRecentFonts);

  // One id root per instance. Every visible label points its control at the
  // matching id: `htmlFor` for real form controls, `labelledBy` for the ui
  // primitives, which render buttons that a <label> cannot name.
  const uid = useId();
  const id = {
    enable: `${uid}-enable`,
    text: `${uid}-text`,
    quickFill: `${uid}-quick-fill`,
    dateFormat: `${uid}-date-format`,
    fontFamily: `${uid}-font-family`,
    weight: `${uid}-weight`,
    position: `${uid}-position`,
    size: `${uid}-size`,
    autoColor: `${uid}-auto-color`,
    colorPicker: `${uid}-color-picker`,
    colorHex: `${uid}-color-hex`,
    shadow: `${uid}-shadow`,
    shadowAuto: `${uid}-shadow-auto`,
    shadowPicker: `${uid}-shadow-picker`,
    shadowHex: `${uid}-shadow-hex`,
    blur: `${uid}-blur`,
    offsetX: `${uid}-offset-x`,
    offsetY: `${uid}-offset-y`,
    effect: `${uid}-effect`,
    intensity: `${uid}-intensity`,
    opacity: `${uid}-opacity`,
  };

  // Sync color inputs when prop changes externally (e.g. preset applied)
  const [prevColor, setPrevColor] = useState(textOverlay.color);
  if (textOverlay.color !== prevColor) {
    setPrevColor(textOverlay.color);
    setOverlayColorInput(textOverlay.color);
  }
  const [prevShadowColor, setPrevShadowColor] = useState(textOverlay.textShadow.color);
  if (textOverlay.textShadow.color !== prevShadowColor) {
    setPrevShadowColor(textOverlay.textShadow.color);
    setShadowColorInput(textOverlay.textShadow.color);
  }

  // --- Font preview lazy loading ---
  const fontListRef = useRef<HTMLDivElement>(null);
  const loadedPreviewFonts = useRef(new Set<string>());

  useEffect(() => {
    if (!fontListRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const fontName = el.dataset.fontName;
          if (!fontName || loadedPreviewFonts.current.has(fontName)) continue;
          loadedPreviewFonts.current.add(fontName);

          const meta = getFontMeta(fontName);
          if (!meta || isGenericFont(meta.family)) continue;
          loadFont(document.fonts, fontName, 400).then(() => {
            el.style.fontFamily = `"${meta.family}", sans-serif`;
          });
        }
      },
      { root: fontListRef.current, rootMargin: '100px' },
    );

    const items = fontListRef.current.querySelectorAll('[data-font-name]');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [fontCategory, showSection]);

  // --- Handlers ---
  const handleFontSelect = useCallback((font: FontMeta) => {
    addRecentFont(font.name);
    setRecentFonts(getRecentFonts());

    // Pick a valid weight for the new font
    const currentWeight = textOverlay.fontWeight;
    const hasWeight = font.weights.some((w) => w.weight === currentWeight);
    const newWeight = hasWeight ? currentWeight : font.weights[0]?.weight ?? 400;

    if (!isGenericFont(font.family)) {
      loadFont(document.fonts, font.name, newWeight);
    }

    onChange({ ...textOverlay, fontFamily: font.name, fontWeight: newWeight });
  }, [textOverlay, onChange]);

  const handleWeightSelect = useCallback((weight: number) => {
    if (!isGenericFont(textOverlay.fontFamily)) {
      loadFont(document.fonts, textOverlay.fontFamily, weight);
    }
    onChange({ ...textOverlay, fontWeight: weight });
  }, [textOverlay, onChange]);

  const handleRandomFont = useCallback(() => {
    const fonts = fontCategory === 'all'
      ? CURATED_FONTS
      : CURATED_FONTS.filter((f) => f.category === fontCategory);
    if (fonts.length === 0) return;
    const random = fonts[Math.floor(Math.random() * fonts.length)];
    handleFontSelect(random);
  }, [fontCategory, handleFontSelect]);

  const handleFilmCameraDate = useCallback(() => {
    const date = exifDate ?? new Date();
    const text = formatDateStamp(date, textOverlay.dateStampFormat);
    onChange({
      ...textOverlay,
      ...FILM_CAMERA_PRESET,
      text,
      dateStampFormat: textOverlay.dateStampFormat,
    } as TextOverlaySettings);
    setShowDateFormat(true);
  }, [textOverlay, onChange, exifDate]);

  const handleTodayDate = useCallback(() => {
    const text = formatDateStamp(new Date(), textOverlay.dateStampFormat);
    onChange({ ...textOverlay, text });
    setShowDateFormat(true);
  }, [textOverlay, onChange]);

  const handleDateFormatChange = useCallback((format: DateStampFormat) => {
    const date = exifDate ?? new Date();
    const text = formatDateStamp(date, format);
    onChange({ ...textOverlay, dateStampFormat: format, text });
  }, [textOverlay, onChange, exifDate]);

  // --- Filter fonts ---
  const filteredFonts = fontCategory === 'all'
    ? ALL_FONTS
    : ALL_FONTS.filter((f) => f.category === fontCategory);

  const featuredFonts = CURATED_FONTS.filter((f) => f.featured);
  const recentFontMetas = recentFonts
    .map((name) => getFontMeta(name))
    .filter((f): f is FontMeta => f !== undefined);

  const selectedMeta = getFontMeta(textOverlay.fontFamily);
  const availableWeights = selectedMeta?.weights ?? [{ weight: 400, label: 'Regular', url: '' }];
  const weightOptions: SegmentOption<number>[] = availableWeights.map((w) => ({
    value: w.weight,
    label: w.label,
  }));

  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setShowSection(!showSection)}
        aria-expanded={showSection}
        className={ACCORDION_TRIGGER}
      >
        <span>Text Overlay</span>
        <svg
          className={cx(
            // `transition-[rotate]`, not `transition-transform`: Tailwind v4's
            // `rotate-180` writes the standalone `rotate` property, so the
            // broader list would enumerate three properties that never change.
            // Same chevron, same class as the one in ControlPanel.
            'size-4 text-muted transition-[rotate] duration-fast ease-out',
            showSection && 'rotate-180',
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Same accordion mechanism as Advanced Settings in ControlPanel: the
          track interpolates `grid-template-rows: 0fr -> 1fr`, the content stays
          in the DOM through the exit, and the margin sits inside the collapsing
          track so nothing is left behind when it closes. */}
      {section.mounted && (
        <div
          ref={sectionRef}
          inert={!showSection}
          className={cx(
            'grid transition-[grid-template-rows,opacity]',
            section.shown
              ? 'grid-rows-[1fr] opacity-100 duration-enter ease-out'
              : 'grid-rows-[0fr] opacity-0 duration-exit ease-in',
          )}
        >
          <div className={cx('min-h-0', !section.settled && 'overflow-hidden')}>
            <div className="mt-4 space-y-4">
              {/* A) Enable toggle */}
              <ToggleRow
                labelId={id.enable}
                label="Enable"
                checked={textOverlay.enabled}
                onChange={(enabled) => onChange({ ...textOverlay, enabled })}
              />

              {textOverlay.enabled && (
                <>
                  {/* B) Text input */}
                  <div className="space-y-1">
                    <label htmlFor={id.text} className="block text-sm text-ink">Text</label>
                    <input
                      id={id.text}
                      type="text"
                      value={textOverlay.text}
                      onChange={(e) => onChange({ ...textOverlay, text: e.target.value })}
                      className="input"
                      placeholder="Your text here..."
                    />
                  </div>

                  {/* Quick Fill — actions, not selections: they write into the text
                      field and leave nothing selected, so these are action chips. */}
                  <div className="space-y-2">
                    <span id={id.quickFill} className="block text-sm text-ink">Quick Fill</span>
                    <ChipGroup label="Quick fill" labelledBy={id.quickFill}>
                      <Chip
                        onClick={handleFilmCameraDate}
                        fill
                        title={exifDate ? `EXIF date: ${exifDate.toLocaleDateString()}` : 'No EXIF date — will use today'}
                        leading={
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        }
                      >
                        Film Camera Date
                      </Chip>
                      <Chip
                        onClick={handleTodayDate}
                        fill
                        leading={
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        }
                      >
                        Today&rsquo;s Date
                      </Chip>
                    </ChipGroup>
                    {showDateFormat && (
                      <div className="space-y-1">
                        <label htmlFor={id.dateFormat} className="block text-sm text-ink">Date Format</label>
                        <select
                          id={id.dateFormat}
                          value={textOverlay.dateStampFormat}
                          onChange={(e) => handleDateFormatChange(e.target.value as DateStampFormat)}
                          className="input"
                        >
                          {DATE_STAMP_FORMATS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label} ({f.example})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* C) Font Picker */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span id={id.fontFamily} className="text-sm text-ink">Font Family</span>
                      <button
                        type="button"
                        onClick={handleRandomFont}
                        title="Random font"
                        aria-label="Random font"
                        className={cx(
                          'cursor-pointer rounded-md p-1 text-muted',
                          'transition-[background-color,color] duration-fast ease-out',
                          'focus-visible:outline-2 focus-visible:outline-offset-2',
                          '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover',
                          '[@media(hover:hover)_and_(pointer:fine)]:hover:text-ink',
                        )}
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>

                    {/* Category filter */}
                    <Segment
                      value={fontCategory}
                      options={FONT_CATEGORY_OPTIONS}
                      onChange={setFontCategory}
                      label="Font category"
                    />

                    {/* Font list */}
                    <div
                      ref={fontListRef}
                      role="group"
                      aria-labelledby={id.fontFamily}
                      className="max-h-44 overflow-y-auto rounded-md border border-border bg-surface scrollbar-thin"
                    >
                      {/* Recent fonts */}
                      {recentFontMetas.length > 0 && fontCategory === 'all' && (
                        <div>
                          <FontListHeading>Recent</FontListHeading>
                          {recentFontMetas.map((font) => (
                            <FontOption
                              key={`recent-${font.name}`}
                              font={font}
                              isSelected={textOverlay.fontFamily === font.name}
                              onSelect={handleFontSelect}
                            />
                          ))}
                        </div>
                      )}

                      {/* Featured fonts */}
                      {featuredFonts.length > 0 && fontCategory === 'all' && (
                        <div>
                          <FontListHeading>Featured</FontListHeading>
                          {featuredFonts.map((font) => (
                            <FontOption
                              key={`featured-${font.name}`}
                              font={font}
                              isSelected={textOverlay.fontFamily === font.name}
                              onSelect={handleFontSelect}
                            />
                          ))}
                        </div>
                      )}

                      {/* All / filtered */}
                      <div>
                        {fontCategory === 'all' && <FontListHeading>All Fonts</FontListHeading>}
                        {filteredFonts.map((font) => (
                          <FontOption
                            key={font.name}
                            font={font}
                            isSelected={textOverlay.fontFamily === font.name}
                            onSelect={handleFontSelect}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Weight — always rendered to prevent layout shift */}
                    <div className="space-y-1">
                      <span id={id.weight} className="block text-sm text-ink">Weight</span>
                      <Segment
                        value={textOverlay.fontWeight}
                        options={weightOptions}
                        onChange={handleWeightSelect}
                        label="Font weight"
                        labelledBy={id.weight}
                        disabled={availableWeights.length === 1}
                      />
                    </div>
                  </div>

                  {/* D) Position */}
                  <div className="space-y-2">
                    <span id={id.position} className="block text-sm text-ink">Position</span>
                    <PositionGrid
                      value={textOverlay.position}
                      onChange={(position) => onChange({ ...textOverlay, position })}
                      label="Position"
                      labelledBy={id.position}
                    />
                  </div>

                  {/* E) Font Size — direct manipulation, no transition anywhere */}
                  <SliderField
                    id={id.size}
                    label="Size"
                    readout={`${textOverlay.fontSize.toFixed(1)}x`}
                    value={textOverlay.fontSize}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    onValueChange={(fontSize) => onChange({ ...textOverlay, fontSize })}
                  />

                  {/* F) Color section */}
                  <div className="space-y-2">
                    <ToggleRow
                      labelId={id.autoColor}
                      label="Auto Contrast Color"
                      checked={textOverlay.useAutoColor}
                      onChange={(useAutoColor) => onChange({ ...textOverlay, useAutoColor })}
                      size="sm"
                    />

                    {!textOverlay.useAutoColor && (
                      <div className="space-y-2">
                        {/* Color presets */}
                        <div role="group" aria-label="Text color presets" className="flex flex-wrap gap-2">
                          {TEXT_COLOR_PRESETS.map((preset) => (
                            <ColorSwatch
                              key={preset.value}
                              color={preset.value}
                              name={preset.name}
                              selected={textOverlay.color === preset.value}
                              onSelect={() => {
                                setOverlayColorInput(preset.value);
                                onChange({ ...textOverlay, color: preset.value });
                              }}
                            />
                          ))}
                        </div>

                        {/* Color picker + hex input */}
                        <div className="flex items-center gap-2">
                          <input
                            id={id.colorPicker}
                            type="color"
                            aria-label="Text color"
                            value={textOverlay.color}
                            onChange={(e) => {
                              setOverlayColorInput(e.target.value);
                              onChange({ ...textOverlay, color: e.target.value });
                            }}
                            className="size-10 flex-none cursor-pointer rounded-md border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2"
                          />
                          <input
                            id={id.colorHex}
                            type="text"
                            aria-label="Text color hex value"
                            value={overlayColorInput}
                            onChange={(e) => {
                              setOverlayColorInput(e.target.value);
                              if (isValidHex(e.target.value)) {
                                onChange({ ...textOverlay, color: normalizeHex(e.target.value) });
                              }
                            }}
                            onBlur={() => {
                              if (isValidHex(overlayColorInput)) {
                                const n = normalizeHex(overlayColorInput);
                                setOverlayColorInput(n);
                                onChange({ ...textOverlay, color: n });
                              } else {
                                setOverlayColorInput(textOverlay.color);
                              }
                            }}
                            className="input data-voice flex-1"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* G) Text Shadow */}
                  <div className="space-y-2">
                    <ToggleRow
                      labelId={id.shadow}
                      label="Text Shadow"
                      checked={textOverlay.textShadow.enabled}
                      onChange={(enabled) => onChange({
                        ...textOverlay,
                        textShadow: { ...textOverlay.textShadow, enabled },
                      })}
                      size="sm"
                    />

                    {textOverlay.textShadow.enabled && (
                      <div className="space-y-2 border-l border-border pl-3">
                        <ToggleRow
                          labelId={id.shadowAuto}
                          label="Auto Color"
                          checked={textOverlay.textShadow.useAutoColor}
                          onChange={(useAutoColor) => onChange({
                            ...textOverlay,
                            textShadow: { ...textOverlay.textShadow, useAutoColor },
                          })}
                          size="sm"
                        />

                        {!textOverlay.textShadow.useAutoColor && (
                          <div className="flex items-center gap-2">
                            <input
                              id={id.shadowPicker}
                              type="color"
                              aria-label="Shadow color"
                              value={textOverlay.textShadow.color}
                              onChange={(e) => {
                                setShadowColorInput(e.target.value);
                                onChange({
                                  ...textOverlay,
                                  textShadow: { ...textOverlay.textShadow, color: e.target.value },
                                });
                              }}
                              className="size-8 flex-none cursor-pointer rounded-md border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2"
                            />
                            <input
                              id={id.shadowHex}
                              type="text"
                              aria-label="Shadow color hex value"
                              value={shadowColorInput}
                              onChange={(e) => {
                                setShadowColorInput(e.target.value);
                                if (isValidHex(e.target.value)) {
                                  onChange({
                                    ...textOverlay,
                                    textShadow: { ...textOverlay.textShadow, color: normalizeHex(e.target.value) },
                                  });
                                }
                              }}
                              onBlur={() => {
                                if (isValidHex(shadowColorInput)) {
                                  const n = normalizeHex(shadowColorInput);
                                  setShadowColorInput(n);
                                  onChange({
                                    ...textOverlay,
                                    textShadow: { ...textOverlay.textShadow, color: n },
                                  });
                                } else {
                                  setShadowColorInput(textOverlay.textShadow.color);
                                }
                              }}
                              className="input data-voice flex-1"
                              placeholder="#000000"
                            />
                          </div>
                        )}

                        <SliderField
                          id={id.blur}
                          label="Blur"
                          readout={`${textOverlay.textShadow.blur}px`}
                          value={textOverlay.textShadow.blur}
                          min={0}
                          max={10}
                          step={1}
                          onValueChange={(blur) => onChange({
                            ...textOverlay,
                            textShadow: { ...textOverlay.textShadow, blur },
                          })}
                        />

                        <SliderField
                          id={id.offsetX}
                          label="Offset X"
                          readout={`${textOverlay.textShadow.offsetX}px`}
                          value={textOverlay.textShadow.offsetX}
                          min={-5}
                          max={5}
                          step={1}
                          onValueChange={(offsetX) => onChange({
                            ...textOverlay,
                            textShadow: { ...textOverlay.textShadow, offsetX },
                          })}
                        />

                        <SliderField
                          id={id.offsetY}
                          label="Offset Y"
                          readout={`${textOverlay.textShadow.offsetY}px`}
                          value={textOverlay.textShadow.offsetY}
                          min={-5}
                          max={5}
                          step={1}
                          onValueChange={(offsetY) => onChange({
                            ...textOverlay,
                            textShadow: { ...textOverlay.textShadow, offsetY },
                          })}
                        />
                      </div>
                    )}
                  </div>

                  {/* H) Text Effect */}
                  <div className="space-y-2">
                    <span id={id.effect} className="block text-sm text-ink">Text Effect</span>
                    <Segment
                      value={textOverlay.textEffect}
                      options={TEXT_EFFECT_OPTIONS}
                      onChange={(textEffect) => onChange({ ...textOverlay, textEffect })}
                      label="Text effect"
                      labelledBy={id.effect}
                    />

                    {textOverlay.textEffect !== 'none' && (
                      <SliderField
                        id={id.intensity}
                        label="Intensity"
                        readout={`${Math.round(textOverlay.effectIntensity * 100)}%`}
                        value={textOverlay.effectIntensity}
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        onValueChange={(effectIntensity) => onChange({ ...textOverlay, effectIntensity })}
                      />
                    )}
                  </div>

                  {/* I) Opacity */}
                  <SliderField
                    id={id.opacity}
                    label="Opacity"
                    readout={`${Math.round(textOverlay.opacity * 100)}%`}
                    value={textOverlay.opacity}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    onValueChange={(opacity) => onChange({ ...textOverlay, opacity })}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Label on the left, control on the right. The visible text is a <span>, not a
 * <label>: Switch renders a button, which a <label> cannot name, so the span
 * carries an id and the switch points at it with `labelledBy`.
 */
function ToggleRow({ labelId, label, checked, onChange, size = 'md' }: {
  labelId: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span id={labelId} className="text-sm text-ink">{label}</span>
      <Switch checked={checked} onChange={onChange} label={label} labelledBy={labelId} size={size} />
    </div>
  );
}

/**
 * A labelled range input. Direct manipulation: the `.slider` class in
 * globals.css carries no transition, so the thumb tracks the pointer one to one
 * and the debounced canvas re-render is the feedback. The readout is a value the
 * user compares, so it takes the data voice.
 */
function SliderField({ id, label, readout, value, min, max, step, onValueChange }: {
  id: string;
  label: string;
  readout: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm text-ink">{label}</label>
        <span className="data-voice text-xs text-muted">{readout}</span>
      </div>
      <input
        id={id}
        type="range"
        className="slider w-full"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onValueChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

/** Sticky group divider inside the font list. Not a section heading - it labels a
 *  run of rows within one widget - so it takes MICRO_LABEL rather than the
 *  heading voice. See src/components/typography.ts for the split. */
function FontListHeading({ children }: { children: ReactNode }) {
  return (
    <div className={cx('sticky top-0 bg-surface px-2 py-1', MICRO_LABEL)}>
      {children}
    </div>
  );
}

/**
 * One text-overlay colour. The payload is the colour itself, so none of the four
 * ui primitives fits: a Chip would tint its own surface. The frame carries the
 * selection language instead - surface elevation plus an accent hairline - and
 * the inner square keeps a frame of its own so a white swatch still has an edge
 * against the panel.
 */
function ColorSwatch({ color, name, selected, onSelect }: {
  color: string;
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={name}
      title={name}
      className={cx(
        'flex size-7 cursor-pointer items-center justify-center rounded-sm border p-0.5',
        'transition-[background-color,border-color] duration-fast ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        selected
          ? 'border-accent-hairline bg-surface-selected'
          : cx(
              'border-transparent bg-transparent',
              '[@media(hover:hover)_and_(pointer:fine)]:hover:border-border',
              '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover',
            ),
      )}
    >
      {/* `border-sample-frame`: this square is image-palette pigment, and the two
          colours it has to survive are #FFFFFF on light chrome and #000000 on
          dark. `border-border` is a control outline and disappears against both. */}
      <span
        aria-hidden="true"
        className="size-full rounded-sm border border-sample-frame"
        style={{ backgroundColor: color }}
      />
    </button>
  );
}

/**
 * One row of the font list, previewed in its own face once the observer has
 * loaded it.
 *
 * Deliberate deviation from the selection language: the third signal is a check
 * glyph, not a heavier font weight. Only the 400 weight of a preview face is
 * loaded, so `font-semibold` here would make the browser synthesise a fake bold
 * and misrepresent the very face the row exists to show. Surface elevation and
 * the accent hairline (on the left edge, where a list reads it) are unchanged.
 *
 * State is `aria-current`, not `aria-pressed`. The list runs to 35 rows, and
 * `aria-pressed` would make 34 of them announce "not pressed" on every pass -
 * noise that buries the one row that matters. Radio semantics would be the
 * textbook fit, but the sticky Recent/Featured/All headings sit between the rows
 * and break the containment a radiogroup needs.
 */
function FontOption({ font, isSelected, onSelect }: {
  font: FontMeta;
  isSelected: boolean;
  onSelect: (font: FontMeta) => void;
}) {
  const fontStyle = isGenericFont(font.family)
    ? { fontFamily: font.family }
    : { fontFamily: `"${font.family}", sans-serif` };

  return (
    <button
      type="button"
      data-font-name={font.name}
      aria-current={isSelected ? true : undefined}
      onClick={() => onSelect(font)}
      className={cx(
        'flex w-full cursor-pointer items-center gap-2 border-l-2 px-2 py-1.5 text-left text-sm text-ink',
        'transition-[background-color,border-color] duration-fast ease-out',
        // Pulled inside: the list scrolls, so an outset ring would be clipped.
        'focus-visible:outline-2 focus-visible:-outline-offset-2',
        isSelected
          ? 'border-accent-hairline bg-surface-selected'
          : cx(
              'border-transparent',
              '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-surface-hover',
            ),
      )}
      style={fontStyle}
    >
      <span className="min-w-0 flex-1 truncate">{font.name}</span>
      {font.tags && font.tags.length > 0 && (
        <span
          className="flex-none text-micro text-muted"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {font.tags[0]}
        </span>
      )}
      {isSelected && (
        // `text-ink`, not `text-accent-hairline`: the hairline token is a border
        // colour, and an icon fill is not a border. This glyph is standing in for
        // the font weight the selection language would otherwise use, so it takes
        // the colour that weight would have carried.
        <svg
          className="size-3.5 flex-none text-ink"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
