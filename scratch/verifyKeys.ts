import { TRANSLATIONS } from '../src/shared/constants.js';

const usedKeys = [
  'examples', 'generator', 'dashboard', 'headline1', 'subheadline',
  'formStep1Title', 'step1Subtitle', 'yourNamePlaceholder', 'businessNamePlaceholder',
  'emailPlaceholder', 'phonePlaceholder', 'step2Title', 'step2Subtitle', 'placeholder',
  'stopListening', 'startListening', 'generateButton', 'reportSubmitted', 'reportFailed',
  'generationFailed', 'tryAgain', 'updateFailed', 'copied', 'copyCode', 'download',
  'generatingNewsletter', 'generateNewsletter', 'startOver', 'aiAssistant', 'aiAssistantHint',
  'placeholderAssistant', 'updateWithAssistant', 'dashboardSubtext', 'websiteManagement',
  'websiteManagementSubtext', 'viewWebsite', 'customizeWebsite', 'businessProfile',
  'aiAnalysis', 'aiAnalysisSubtext', 'analyzing', 'stopSpeaking', 'analyzeAndSpeak',
  'todaysVisitors', 'peakTime', 'mostViewed', 'servicesPage', 'campaignLaunches',
  'upcoming', 'summerSale', 'past', 'springLaunch', 'newCampaign', 'mostViewedPages',
  'homePage', 'aboutPage', 'latestReviews', 'sentiment', 'positive'
];

const enKeys = new Set(Object.keys(TRANSLATIONS['en-US']));

for (const key of usedKeys) {
  if (!enKeys.has(key)) {
    console.log('MISSING KEY:', key);
  }
}
