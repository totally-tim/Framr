import { useMemo } from 'react';
import type { Preset, BorderSettings } from '../types';

interface PresetButtonsProps {
  currentSettings: BorderSettings;
  onApply: (settings: BorderSettings) => void;
}

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'white-3',
    name: 'White 3%',
    border: { width: 3, widthUnit: '%', color: '#FFFFFF', aspectAware: false },
    description: 'Minimal white border',
  },
  {
    id: 'white-5',
    name: 'White 5%',
    border: { width: 5, widthUnit: '%', color: '#FFFFFF', aspectAware: false },
    description: 'Standard white border',
  },
  {
    id: 'white-10',
    name: 'White 10%',
    border: { width: 10, widthUnit: '%', color: '#FFFFFF', aspectAware: false },
    description: 'Prominent white border',
  },
  {
    id: 'black-3',
    name: 'Black 3%',
    border: { width: 3, widthUnit: '%', color: '#000000', aspectAware: false },
    description: 'Minimal black border',
  },
  {
    id: 'black-5',
    name: 'Black 5%',
    border: { width: 5, widthUnit: '%', color: '#000000', aspectAware: false },
    description: 'Standard black border',
  },
  {
    id: 'black-10',
    name: 'Black 10%',
    border: { width: 10, widthUnit: '%', color: '#000000', aspectAware: false },
    description: 'Prominent black border',
  },
];

export function PresetButtons({ currentSettings, onApply }: PresetButtonsProps) {
  const isActive = useMemo(() => {
    return (preset: Preset) => {
      return (
        preset.border.width === currentSettings.width &&
        preset.border.widthUnit === currentSettings.widthUnit &&
        preset.border.color === currentSettings.color &&
        preset.border.aspectAware === currentSettings.aspectAware
      );
    };
  }, [currentSettings]);

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wider">
        Quick Presets
      </h3>

      <div className="flex flex-wrap gap-2">
        {DEFAULT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onApply(preset.border)}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-all
              ${isActive(preset)
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
  );
}
