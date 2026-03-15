import { useState, useCallback, useRef, useEffect } from 'react';
import type { TextOverlaySettings, TextPosition, FontMeta, DateStampFormat } from '../types';
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

interface TextOverlayControlsProps {
  textOverlay: TextOverlaySettings;
  onChange: (settings: TextOverlaySettings) => void;
  exifDate?: Date;
}

const POSITION_GRID: { value: TextPosition; label: string }[][] = [
  [
    { value: 'top-left', label: 'TL' },
    { value: 'top-center', label: 'TC' },
    { value: 'top-right', label: 'TR' },
  ],
  [
    { value: 'middle-left', label: 'ML' },
    { value: 'middle-center', label: 'MC' },
    { value: 'middle-right', label: 'MR' },
  ],
  [
    { value: 'bottom-left', label: 'BL' },
    { value: 'bottom-center', label: 'BC' },
    { value: 'bottom-right', label: 'BR' },
  ],
];

export function TextOverlayControls({ textOverlay, onChange, exifDate }: TextOverlayControlsProps) {
  const [showSection, setShowSection] = useState(false);
  const [overlayColorInput, setOverlayColorInput] = useState(textOverlay.color);
  const [shadowColorInput, setShadowColorInput] = useState(textOverlay.textShadow.color);
  const [fontCategory, setFontCategory] = useState<FontCategory>('all');
  const [showDateFormat, setShowDateFormat] = useState(false);
  const [recentFonts, setRecentFonts] = useState<string[]>(getRecentFonts);

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

  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setShowSection(!showSection)}
        className="flex items-center justify-between w-full py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <span>Text Overlay</span>
        <svg
          className={`w-4 h-4 transition-transform ${showSection ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showSection && (
        <div className="mt-4 space-y-4">
          {/* A) Enable toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600 dark:text-gray-300">Enable</label>
            <button
              onClick={() => onChange({ ...textOverlay, enabled: !textOverlay.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${textOverlay.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${textOverlay.enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {textOverlay.enabled && (
            <>
              {/* B) Text input */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Text</label>
                <input
                  type="text"
                  value={textOverlay.text}
                  onChange={(e) => onChange({ ...textOverlay, text: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded border bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your text here..."
                />
              </div>

              {/* Quick Fill buttons */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Quick Fill</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleFilmCameraDate}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={exifDate ? `EXIF date: ${exifDate.toLocaleDateString()}` : 'No EXIF date — will use today'}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Film Camera Date
                  </button>
                  <button
                    onClick={handleTodayDate}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded border bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Today's Date
                  </button>
                </div>
                {showDateFormat && (
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Date Format</label>
                    <select
                      value={textOverlay.dateStampFormat}
                      onChange={(e) => handleDateFormatChange(e.target.value as DateStampFormat)}
                      className="w-full px-3 py-1.5 text-sm rounded border bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Font Family</label>
                  <button
                    onClick={handleRandomFont}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Random font"
                  >
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {/* Category tabs */}
                <div className="flex rounded-lg overflow-hidden border">
                  {FONT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setFontCategory(cat.value)}
                      className={`flex-1 py-1 text-[10px] font-medium transition-colors ${
                        fontCategory === cat.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Font list */}
                <div
                  ref={fontListRef}
                  className="max-h-44 overflow-y-auto border rounded bg-white dark:bg-gray-800 scrollbar-thin"
                >
                  {/* Recent fonts */}
                  {recentFontMetas.length > 0 && fontCategory === 'all' && (
                    <div>
                      <div className="px-2 py-1 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-800">
                        Recent
                      </div>
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
                      <div className="px-2 py-1 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-800">
                        Featured
                      </div>
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
                    {fontCategory === 'all' && (
                      <div className="px-2 py-1 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-800">
                        All Fonts
                      </div>
                    )}
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

                {/* Weight buttons — always rendered to prevent layout shift */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Weight</label>
                  <div className="flex gap-1 flex-wrap">
                    {availableWeights.map((w) => (
                      <button
                        key={w.weight}
                        disabled={availableWeights.length === 1}
                        onClick={() => {
                          if (!isGenericFont(textOverlay.fontFamily)) {
                            loadFont(document.fonts, textOverlay.fontFamily, w.weight);
                          }
                          onChange({ ...textOverlay, fontWeight: w.weight });
                        }}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          textOverlay.fontWeight === w.weight
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        } disabled:opacity-60 disabled:cursor-default`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* D) Position Grid */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">Position</label>
                <div className="grid grid-cols-3 gap-1 w-fit">
                  {POSITION_GRID.flat().map((cell) => (
                    <button
                      key={cell.value}
                      onClick={() => onChange({ ...textOverlay, position: cell.value })}
                      className={`w-10 h-8 text-[10px] font-medium rounded transition-colors ${
                        textOverlay.position === cell.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {cell.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* E) Font Size slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Size</label>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{textOverlay.fontSize.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  value={textOverlay.fontSize}
                  onChange={(e) => onChange({ ...textOverlay, fontSize: parseFloat(e.target.value) })}
                  className="slider w-full"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
              </div>

              {/* F) Color section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Auto Contrast Color</label>
                  <button
                    onClick={() => onChange({ ...textOverlay, useAutoColor: !textOverlay.useAutoColor })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${textOverlay.useAutoColor ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${textOverlay.useAutoColor ? 'translate-x-4' : ''}`} />
                  </button>
                </div>

                {!textOverlay.useAutoColor && (
                  <div className="space-y-2">
                    {/* Color presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {TEXT_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => {
                            setOverlayColorInput(preset.value);
                            onChange({ ...textOverlay, color: preset.value });
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            textOverlay.color === preset.value
                              ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900'
                              : 'hover:scale-110'
                          } ${preset.value === '#FFFFFF' ? 'border-gray-300' : 'border-transparent'}`}
                          style={{ backgroundColor: preset.value }}
                          title={preset.name}
                          aria-label={preset.name}
                        />
                      ))}
                    </div>

                    {/* Color picker + hex input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textOverlay.color}
                        onChange={(e) => {
                          setOverlayColorInput(e.target.value);
                          onChange({ ...textOverlay, color: e.target.value });
                        }}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
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
                        className="flex-1 px-3 py-2 text-sm rounded border bg-white dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* G) Text Shadow */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Text Shadow</label>
                  <button
                    onClick={() => onChange({
                      ...textOverlay,
                      textShadow: { ...textOverlay.textShadow, enabled: !textOverlay.textShadow.enabled },
                    })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${textOverlay.textShadow.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${textOverlay.textShadow.enabled ? 'translate-x-4' : ''}`} />
                  </button>
                </div>

                {textOverlay.textShadow.enabled && (
                  <div className="space-y-2 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-500 dark:text-gray-400">Auto Color</label>
                      <button
                        onClick={() => onChange({
                          ...textOverlay,
                          textShadow: { ...textOverlay.textShadow, useAutoColor: !textOverlay.textShadow.useAutoColor },
                        })}
                        className={`relative w-9 h-5 rounded-full transition-colors ${textOverlay.textShadow.useAutoColor ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${textOverlay.textShadow.useAutoColor ? 'translate-x-4' : ''}`} />
                      </button>
                    </div>

                    {!textOverlay.textShadow.useAutoColor && (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textOverlay.textShadow.color}
                          onChange={(e) => {
                            setShadowColorInput(e.target.value);
                            onChange({
                              ...textOverlay,
                              textShadow: { ...textOverlay.textShadow, color: e.target.value },
                            });
                          }}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
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
                          className="flex-1 px-2 py-1.5 text-sm rounded border bg-white dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#000000"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-500 dark:text-gray-400">Blur</label>
                        <span className="text-xs text-gray-600 dark:text-gray-300">{textOverlay.textShadow.blur}px</span>
                      </div>
                      <input
                        type="range"
                        value={textOverlay.textShadow.blur}
                        onChange={(e) => onChange({
                          ...textOverlay,
                          textShadow: { ...textOverlay.textShadow, blur: parseInt(e.target.value) },
                        })}
                        className="slider w-full"
                        min={0}
                        max={10}
                        step={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-500 dark:text-gray-400">Offset X</label>
                        <span className="text-xs text-gray-600 dark:text-gray-300">{textOverlay.textShadow.offsetX}px</span>
                      </div>
                      <input
                        type="range"
                        value={textOverlay.textShadow.offsetX}
                        onChange={(e) => onChange({
                          ...textOverlay,
                          textShadow: { ...textOverlay.textShadow, offsetX: parseInt(e.target.value) },
                        })}
                        className="slider w-full"
                        min={-5}
                        max={5}
                        step={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-500 dark:text-gray-400">Offset Y</label>
                        <span className="text-xs text-gray-600 dark:text-gray-300">{textOverlay.textShadow.offsetY}px</span>
                      </div>
                      <input
                        type="range"
                        value={textOverlay.textShadow.offsetY}
                        onChange={(e) => onChange({
                          ...textOverlay,
                          textShadow: { ...textOverlay.textShadow, offsetY: parseInt(e.target.value) },
                        })}
                        className="slider w-full"
                        min={-5}
                        max={5}
                        step={1}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* H) Opacity slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Opacity</label>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{Math.round(textOverlay.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={textOverlay.opacity}
                  onChange={(e) => onChange({ ...textOverlay, opacity: parseFloat(e.target.value) })}
                  className="slider w-full"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
      data-font-name={font.name}
      onClick={() => onSelect(font)}
      className={`w-full text-left px-2 py-1.5 text-sm transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
      style={fontStyle}
    >
      {font.name}
      {font.tags && font.tags.length > 0 && (
        <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-500" style={{ fontFamily: 'sans-serif' }}>
          {font.tags[0]}
        </span>
      )}
    </button>
  );
}
