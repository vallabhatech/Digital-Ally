import React from 'react';
import { EyeIcon, CodeIcon } from '@/components/IconSet';

interface PreviewTabsProps {
  activeView: 'preview' | 'code';
  onChange: (value: 'preview' | 'code') => void;
}

export const PreviewTabs: React.FC<PreviewTabsProps> = ({ activeView, onChange }) => (
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => onChange('preview')}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
        activeView === 'preview'
          ? 'bg-lime-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <EyeIcon className="w-5 h-5" /> Preview
    </button>
    <button
      type="button"
      onClick={() => onChange('code')}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
        activeView === 'code'
          ? 'bg-lime-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <CodeIcon className="w-5 h-5" /> Code
    </button>
  </div>
);
