import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import { BizBoostLogoIcon, GlobeIcon, SparklesIcon } from './icons';
import { LANGUAGES, EXAMPLE_PROMPTS } from '../constants';

export const Header: React.FC = () => {
  const context = useContext(AppContext);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!context) return null;

  const { language, setLanguage, t, pageState, setPageState, handleSelectExample } = context;

  const getLinkClasses = (linkState: 'form' | 'dashboard') => {
    const baseClasses = "hover:text-lime-700 transition-colors px-1";
    const activeClasses = "text-lime-600 font-semibold border-b-2 border-lime-600";
    return `${baseClasses} ${pageState === linkState ? activeClasses : 'border-b-2 border-transparent'}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExamplesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectExample = (prompt: string) => {
    if (prompt) {
      handleSelectExample(prompt);
    }
    setIsExamplesOpen(false);
  }

  return (
    <header className="flex items-center justify-between p-4 bg-transparent sticky top-0 z-20 w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-8">
        <button onClick={() => setPageState('form')} className="flex items-center gap-3 focus:outline-none">
          <BizBoostLogoIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-gray-800">BizBoost</h1>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsExamplesOpen(prev => !prev)}
            className="flex items-center gap-1.5 text-gray-600 font-medium hover:text-lime-700 transition-colors"
            aria-haspopup="true"
            aria-expanded={isExamplesOpen}
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{t('examples')}</span>
          </button>
          {isExamplesOpen && (
            <div 
              className="absolute left-0 mt-2 w-56 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in-up-short" 
              style={{animationDuration: '0.3s'}}
              role="menu" 
              aria-orientation="vertical" 
              aria-labelledby="options-menu"
            >
              <div className="py-1">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <button
                    key={example.label}
                    onClick={() => selectExample(example.prompt)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      index === 0
                        ? 'text-gray-500 cursor-default'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    role="menuitem"
                    disabled={!example.prompt}
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-6 text-gray-600 font-medium">
        <button onClick={() => setPageState('form')} className={getLinkClasses('form')}>
          {t('generator')}
        </button>
        <button onClick={() => setPageState('dashboard')} className={getLinkClasses('dashboard')}>
          {t('dashboard')}
        </button>
        <div className="flex items-center gap-2">
            <GlobeIcon className="w-5 h-5 text-gray-500" />
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent border-none text-gray-600 focus:ring-0 focus:outline-none font-medium"
                aria-label="Select language"
            >
                {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
      </div>
    </header>
  );
};