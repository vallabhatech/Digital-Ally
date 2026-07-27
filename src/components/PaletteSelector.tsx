import React from 'react';
import { COLOR_PALETTES } from '@/shared/constants';

interface PaletteSelectorProps {
  selectedPalette: string;
  onSelectPalette: (paletteName: string) => void;
  error?: string;
  getLabel: (name: string) => string;
}

export const PaletteSelector: React.FC<PaletteSelectorProps> = ({
  selectedPalette,
  onSelectPalette,
  error,
  getLabel,
}) => (
  <div>
    {error && (
      <p className="text-red-600 text-sm mb-2" role="alert" aria-live="polite">
        {error}
      </p>
    )}
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      role="radiogroup"
      aria-label="Color Palette"
    >
      {COLOR_PALETTES.map((palette) => (
        <button
          key={palette.name}
          type="button"
          role="radio"
          aria-checked={selectedPalette === palette.name}
          onClick={() => onSelectPalette(palette.name)}
          className={`p-4 rounded-2xl border-4 transition ${
            selectedPalette === palette.name
              ? 'border-lime-500 scale-105'
              : 'border-gray-200 hover:border-lime-300'
          }`}
        >
          <div className="flex -space-x-2 justify-center mb-2">
            {Object.values(palette.palette).map((color, index) => (
              <div key={index} className={`w-8 h-8 rounded-full border-2 border-white ${color}`} />
            ))}
          </div>
          <h3 className="font-bold text-gray-800 text-center">{getLabel(palette.name)}</h3>
        </button>
      ))}
    </div>
  </div>
);
