import React, { useState, useRef, useEffect } from 'react';
import { DigitalAllyLogoIcon, GlobeIcon, SparklesIcon } from '@/components/IconSet';
import { LANGUAGES, EXAMPLE_PROMPTS } from '@/shared/constants';
import { useAppStore } from '@/store/useAppStore';
import {
  selectClearPrivateData,
  selectHandleSelectExample,
  selectLanguage,
  selectPageState,
  selectPrivacyMode,
  selectReviewPrivacyChoice,
  selectSetField,
  selectSetPrivacyMode,
  selectTranslator,
} from '@/store/selectors';
export const Header: React.FC = () => {
  const language = useAppStore(selectLanguage);
  const t = useAppStore(selectTranslator);
  const pageState = useAppStore(selectPageState);
  const privacyMode = useAppStore(selectPrivacyMode);
  const setField = useAppStore(selectSetField);
  const setPrivacyMode = useAppStore(selectSetPrivacyMode);
  const reviewPrivacyChoice = useAppStore(selectReviewPrivacyChoice);
  const clearPrivateData = useAppStore(selectClearPrivateData);
  const handleSelectExample = useAppStore(selectHandleSelectExample);

  // 2. Functional wrappers to adapt old setter states safely
  const setLanguage = (val: string) => setField('language', val);
  const setPageState = (val: 'form' | 'loading' | 'result' | 'dashboard') =>
    setField('pageState', val);

  // 3. Keep your local UI state variables exactly the same
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu toggle
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getLinkClasses = (linkState: 'form' | 'dashboard') => {
    const baseClasses = 'hover:text-lime-700 transition-colors px-1 w-full text-left md:w-auto';
    const activeClasses = 'text-lime-600 font-semibold md:border-b-2 md:border-lime-600';
    return `${baseClasses} ${pageState === linkState ? activeClasses : 'md:border-b-2 md:border-transparent'}`;
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
    setIsMenuOpen(false); // Close mobile tray on click
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 w-full max-w-7xl mx-auto border-b border-gray-100 md:border-none md:bg-transparent">
      <div className="flex items-center justify-between p-4">
        {/* Left Section: Brand & Examples */}
        <div className="flex items-center gap-4 md:gap-8">
          <button
            onClick={() => {
              setPageState('form');
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-3 focus:outline-none"
          >
            <DigitalAllyLogoIcon className="w-8 h-8" />
            <h1 className="text-2xl font-bold text-gray-800">Digital Ally</h1>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsExamplesOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-gray-600 font-medium hover:text-lime-700 transition-colors"
              aria-haspopup="true"
              aria-expanded={isExamplesOpen}
            >
              <SparklesIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{t('examples')}</span>
            </button>
            {isExamplesOpen && (
              <div
                className="absolute left-0 mt-2 w-56 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30"
                role="menu"
                aria-orientation="vertical"
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

        {/* Hamburger Toggle (Visible only on mobile) */}
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="p-2 text-gray-600 hover:text-lime-700 focus:outline-none md:hidden"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-gray-600 font-medium">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <span
              className={privacyMode === 'local' ? 'text-green-700 font-semibold' : 'text-gray-500'}
            >
              Privacy
            </span>
            <select
              value={privacyMode || ''}
              onChange={(event) => {
                const nextMode = event.target.value as 'remote' | 'local';
                if (nextMode === 'remote' && privacyMode !== 'remote') {
                  reviewPrivacyChoice();
                } else {
                  setPrivacyMode(nextMode);
                }
              }}
              className="rounded-md border border-gray-300 bg-white px-2 py-1"
              aria-label="AI processing mode"
            >
              <option value="remote">Remote AI</option>
              <option value="local">Local only</option>
            </select>
          </label>
          <button
            onClick={clearPrivateData}
            className="text-sm hover:text-red-700"
            title="Clear form, generated content, and saved privacy choice"
          >
            Delete my data
          </button>
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
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu Drawer */}
      {isMenuOpen && (
        <div className="md:hidden bg-white px-4 pt-2 pb-6 border-b border-gray-200 flex flex-col gap-4 text-gray-600 font-medium absolute left-0 right-0 shadow-lg z-10 animate-fade-in">
          <label className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm">
            <span
              className={privacyMode === 'local' ? 'text-green-700 font-semibold' : 'text-gray-500'}
            >
              Privacy Mode
            </span>
            <select
              value={privacyMode || ''}
              onChange={(event) => {
                const nextMode = event.target.value as 'remote' | 'local';
                if (nextMode === 'remote' && privacyMode !== 'remote') {
                  reviewPrivacyChoice();
                } else {
                  setPrivacyMode(nextMode);
                }
              }}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
            >
              <option value="remote">Remote AI</option>
              <option value="local">Local only</option>
            </select>
          </label>

          <button
            onClick={() => {
              clearPrivateData();
              setIsMenuOpen(false);
            }}
            className="text-sm text-left text-red-600 py-1 border-b border-gray-100"
          >
            Delete my data
          </button>

          <button
            onClick={() => {
              setPageState('form');
              setIsMenuOpen(false);
            }}
            className={`${getLinkClasses('form')} border-b border-gray-100 pb-2`}
          >
            {t('generator')}
          </button>

          <button
            onClick={() => {
              setPageState('dashboard');
              setIsMenuOpen(false);
            }}
            className={`${getLinkClasses('dashboard')} border-b border-gray-100 pb-2`}
          >
            {t('dashboard')}
          </button>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <GlobeIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-500">Language</span>
            </div>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setIsMenuOpen(false);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-600 bg-white"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};
