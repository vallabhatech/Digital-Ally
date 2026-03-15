import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { COLOR_PALETTES } from '../constants';
import { CheckIcon, MicrophoneIcon, SparklesIcon } from './icons';

export const InputPanel: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    
    const { 
        t, userName, setUserName, businessName, setBusinessName, userEmail, setUserEmail, 
        userPhone, setUserPhone, prompt, setPrompt, selectedPalette, setSelectedPalette,
        handleGenerate, language, error, services, setServices, location, setLocation,
        themeColor, setThemeColor
    } = context;

    const { isListening, error: speechError, toggleListening } = useSpeechToText({ onTranscript: setPrompt, lang: language });
    const [unlockedSections, setUnlockedSections] = useState({ 
        details: false, 
        description: false, 
        services: false, 
        style: false 
    });

    const detailsComplete = userName.trim() !== '' && businessName.trim() !== '' && userEmail.trim() !== '' && userPhone.trim() !== '';
    const descriptionComplete = prompt.trim() !== '';
    const servicesComplete = services.trim() !== '';
    
    React.useEffect(() => {
        setUnlockedSections({
            details: detailsComplete,
            description: detailsComplete,
            services: detailsComplete && descriptionComplete,
            style: detailsComplete && descriptionComplete && servicesComplete,
        });
    }, [detailsComplete, descriptionComplete, servicesComplete]);

    const canGenerate = detailsComplete && descriptionComplete && selectedPalette;

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-fade-in-up">
            <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800">{t('headline1')}</h2>
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{t('subheadline')}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
                {/* Step 1: Business Details */}
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-3">
                        {t('formStep1Title')}
                        {detailsComplete && <CheckIcon className="w-6 h-6 text-green-500"/>}
                    </h3>
                    <p className="text-gray-500 mb-6">{t('step1Subtitle')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                            type="text" 
                            value={userName} 
                            onChange={(e) => setUserName(e.target.value)} 
                            placeholder={t('yourNamePlaceholder')} 
                            className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500" 
                        />
                        <input 
                            type="text" 
                            value={businessName} 
                            onChange={(e) => setBusinessName(e.target.value)} 
                            placeholder={t('businessNamePlaceholder')} 
                            className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500" 
                        />
                        <input 
                            type="email" 
                            value={userEmail} 
                            onChange={(e) => setUserEmail(e.target.value)} 
                            placeholder={t('emailPlaceholder')} 
                            className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500" 
                        />
                        <input 
                            type="tel" 
                            value={userPhone} 
                            onChange={(e) => setUserPhone(e.target.value)} 
                            placeholder={t('phonePlaceholder')} 
                            className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500" 
                        />
                    </div>
                </div>

                {/* Step 2: Business Description */}
                {unlockedSections.description && (
                    <div className="mb-8 animate-fade-in-up-short">
                        <h3 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-3">
                            {t('step2Title')}
                            {descriptionComplete && <CheckIcon className="w-6 h-6 text-green-500"/>}
                        </h3>
                        <p className="text-gray-500 mb-6">{t('step2Subtitle')}</p>
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-36 p-4 pr-16 bg-white/50 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-lime-500 resize-y"
                                placeholder={t('placeholder')}
                            />
                            <button
                                onClick={toggleListening}
                                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                                    isListening
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                                aria-label={isListening ? t('stopListening') : t('startListening')}
                            >
                                <MicrophoneIcon className="w-6 h-6" />
                            </button>
                        </div>
                        {speechError && <p className="text-red-500 mt-2">{speechError}</p>}
                    </div>
                )}

                {/* Step 3: Services */}
                {unlockedSections.services && (
                    <div className="mb-8 animate-fade-in-up-short">
                        <h3 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-3">
                            Services & Products
                            {servicesComplete && <CheckIcon className="w-6 h-6 text-green-500"/>}
                        </h3>
                        <p className="text-gray-500 mb-6">Describe what your business offers</p>
                        <textarea
                            value={services}
                            onChange={(e) => setServices(e.target.value)}
                            className="w-full h-32 p-4 bg-white/50 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-lime-500 resize-y"
                            placeholder="e.g., Web design, digital marketing, consulting, coffee and pastries..."
                        />
                    </div>
                )}

                {/* Step 4: Location & Theme */}
                {unlockedSections.style && (
                    <div className="animate-fade-in-up-short">
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">Location & Style</h3>
                        <p className="text-gray-500 mb-6">Set your location and choose a style</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Business Location</label>
                                <input 
                                    type="text" 
                                    value={location} 
                                    onChange={(e) => setLocation(e.target.value)} 
                                    placeholder="City, State or Country"
                                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        value={themeColor} 
                                        onChange={(e) => setThemeColor(e.target.value)} 
                                        className="w-16 h-12 border border-gray-200 rounded cursor-pointer"
                                    />
                                    <input 
                                        type="text" 
                                        value={themeColor} 
                                        onChange={(e) => setThemeColor(e.target.value)} 
                                        placeholder="#10b981"
                                        className="flex-1 px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Color Palette</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {COLOR_PALETTES.map(p => (
                                    <button 
                                        key={p.name} 
                                        onClick={() => setSelectedPalette(p.name)} 
                                        className={`p-4 rounded-lg border-4 transition ${
                                            selectedPalette === p.name ? 'border-lime-500 scale-105' : 'border-gray-200 hover:border-lime-300'
                                        }`}
                                    >
                                        <div className="flex -space-x-2 justify-center mb-2">
                                            {Object.values(p.palette).map((color, i) => (
                                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${color}`}></div>
                                            ))}
                                        </div>
                                        <h3 className="font-bold text-gray-800">{t(p.name)}</h3>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {error && <p className="text-red-500 mt-6 text-center font-medium">{error}</p>}

                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <button 
                                onClick={handleGenerate} 
                                disabled={!canGenerate} 
                                className="bg-lime-500 text-white font-bold py-4 px-16 text-lg rounded-lg hover:bg-lime-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
                            >
                                <SparklesIcon className="w-6 h-6" /> {t('generateButton')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};