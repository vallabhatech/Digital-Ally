export const LANGUAGES = [
    { label: 'English', value: 'en-US' },
    { label: 'తెలుగు', value: 'te-IN' },
    { label: 'हिन्दी', value: 'hi-IN' },
];

export const AI_PROVIDERS = [
    { label: 'Gemini', value: 'gemini' },
    { label: 'Claude', value: 'claude' },
];

export const COLOR_PALETTES = [
    { name: 'Modern', palette: { bg: 'bg-white', primary: 'bg-indigo-600', text: 'text-gray-800', subtle: 'bg-gray-50' }, description: "Primary: Indigo for trust and modernity. Use for buttons, links, and key highlights. Backgrounds: White and light gray for a clean, spacious feel. Text: Dark gray for readability." },
    { name: 'Vibrant', palette: { bg: 'bg-white', primary: 'bg-orange-500', text: 'text-gray-900', subtle: 'bg-yellow-50' }, description: "Primary: Bright orange for energy and creativity. Use for calls-to-action. Backgrounds: Soft yellow and white for a warm, inviting atmosphere. Text: Nearly black for strong contrast." },
    { name: 'Corporate', palette: { bg: 'bg-white', primary: 'bg-blue-800', text: 'text-gray-700', subtle: 'bg-slate-100' }, description: "Primary: Deep blue for professionalism and stability. Use for headers and buttons. Backgrounds: Cool-toned slate and white for a serious, clean look. Text: Muted gray for a formal tone." },
    { name: 'Elegant', palette: { bg: 'bg-gray-900', primary: 'bg-amber-400', text: 'text-white', subtle: 'bg-gray-800' }, description: "Primary: Gold/amber for a touch of luxury. Use for highlights and buttons. Backgrounds: Dark charcoal and black for a sophisticated, premium feel. Text: White for crisp readability on dark backgrounds." },
];


export const TRANSLATIONS: { [key: string]: { [key: string]: string } } = {
  'en-US': {
    generator: 'Generator',
    dashboard: 'Dashboard',
    examples: 'Examples',
    headline1: 'Build Your Website in Minutes.',
    headline2: 'Get Your Website.',
    subheadline: 'Describe your business and let AI do the rest. No coding required.',
    speakButtonText: 'Click to speak about your business',
    generateButton: 'Generate Website',
    placeholder: 'e.g., "We sell organic coffee and pastries. I want a modern and minimalist design."',
    placeholderAssistant: 'e.g., "Make the headline bolder"',
    yourNamePlaceholder: 'Your Name',
    businessNamePlaceholder: 'Your Business Name',
    emailPlaceholder: 'Your Business Email',
    phonePlaceholder: 'Your Business Phone',
    generating: 'Generating...',
    loadingMessage: 'The AI is building your website...',
    loadingSubMessage: 'This may take a moment. Great things are on the way!',
    startOver: 'Start Over',
    tryAgain: 'Try Again',
    preview: 'Preview',
    code: 'Code',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    download: 'Download',
    generationFailed: 'Generation Failed',
    updateFailed: 'The AI returned an invalid response. Your last working version is shown.',
    errorAssistant: 'Please provide instructions for the assistant.',
    errorFormNotComplete: 'Please fill out all fields and select a style.',
    formStep1Title: '1. Your Details',
    step1Subtitle: 'These details will be shown on your new website.',
    step2Title: '2. Business Description',
    step2Subtitle: 'Use your voice or type in any language. Be as descriptive as you can!',
    step3Title: '3. Style',
    step3Subtitle: 'Select a color palette that fits your brand.',
    aiProviderLabel: 'AI Provider',
    aiProviderSubtitle: 'Choose which AI to use for generation.',
    listening: 'Listening...',
    startListening: 'Start Listening',
    stopListening: 'Stop Listening',
    Modern: 'Modern',
    Vibrant: 'Vibrant',
    Corporate: 'Corporate',
    Elegant: 'Elegant',
    customizeAndRegenerate: 'Customize & Regenerate',
    regenerateButton: 'Regenerate Website',
    aiAssistant: 'AI Assistant',
    aiAssistantHint: 'Ask for specific changes, e.g., "Make the contact section more prominent."',
    updateWithAssistant: 'Update with Assistant',
    yourChanges: 'Make changes and regenerate',
    promoteYourSite: 'Promote Your Site',
    openWebsite: 'Open Website',
    copyLink: 'Copy Link',
    generateNewsletter: 'Generate Marketing Text',
    generatingNewsletter: 'Generating...',
    shareOnWhatsApp: 'Share on WhatsApp',
    pasteInWhatsApp: 'Copied! Now paste into your chat.',
    businessProfile: 'Business Profile',
    todaysVisitors: "Today's Visitors",
    campaignLaunches: 'Campaign Launches',
    mostViewedPages: 'Most Viewed Pages',
    latestReviews: 'Latest Reviews',
    peakTime: 'Peak Time',
    mostViewed: 'Most Viewed',
    upcoming: 'Upcoming',
    past: 'Past',
    sentiment: 'Sentiment',
    positive: 'Positive',
    newCampaign: 'New Campaign',
    homePage: 'Home Page',
    aboutPage: 'About Page',
    servicesPage: 'Services Page',
    summerSale: 'Summer Sale (Starts July 1st)',
    springLaunch: 'Spring Launch (Completed May 15th)',
    dashboardWelcome: 'Welcome to your Dashboard',
    dashboardPrompt: 'Generate your website first to see your business data here.',
    goToGenerator: 'Go to Generator',
    aiAnalysis: 'AI Analysis',
    aiAnalysisSubtext: 'Let AI analyze your dashboard and give you a spoken summary in your chosen language.',
    analyzeAndSpeak: 'Analyze & Speak',
    analyzing: 'Analyzing...',
    stopSpeaking: 'Stop Speaking',
    yourWebsite: 'Your Website Preview',
    customizeWebsite: 'View & Customize',
  },
  'te-IN': {
    generator: 'జెనరేటర్',
    dashboard: 'డాష్‌బోర్డ్',
    examples: 'ఉదాహరణలు',
    headline1: 'నిమిషాల్లో మీ వెబ్‌సైట్‌ను రూపొందించండి.',
    subheadline: 'మీ వ్యాపారాన్ని వివరించండి మరియు మిగిలినది AI చూసుకుంటుంది. కోడింగ్ అవసరం లేదు.',
    speakButtonText: 'మీ వ్యాపారం గురించి మాట్లాడటానికి క్లిక్ చేయండి',
    generateButton: 'వెబ్‌సైట్ రూపొందించండి',
    placeholder: 'ఉదా., "మేము సేంద్రీయ కాఫీ మరియు పేస్ట్రీలను విక్రయిస్తాము. నాకు ఆధునిక డిజైన్ కావాలి."',
    placeholderAssistant: 'ఉదా., "హెడ్‌లైన్‌ను మరింత పెద్దదిగా చేయండి"',
    yourNamePlaceholder: 'మీ పేరు',
    businessNamePlaceholder: 'మీ వ్యాపారం పేరు',
    emailPlaceholder: 'మీ వ్యాపార ఇమెయిల్',
    phonePlaceholder: 'మీ వ్యాపార ఫోన్',
    generating: 'రూపొందిస్తోంది...',
    loadingMessage: 'AI మీ వెబ్‌సైట్‌ను నిర్మిస్తోంది...',
    loadingSubMessage: 'దీనికి కొంత సమయం పట్టవచ్చు. గొప్ప విషయాలు రాబోతున్నాయి!',
    startOver: 'మళ్ళీ ప్రారంభించండి',
    tryAgain: 'మళ్ళీ ప్రయత్నించండి',
    preview: 'ప్రివ్యూ',
    code: 'కోడ్',
    copyCode: 'కోడ్ కాపీ చేయండి',
    copied: 'కాపీ చేయబడింది!',
    download: 'డౌన్‌లోడ్ చేయండి',
    generationFailed: 'ఉత్పత్తి విఫలమైంది',
    updateFailed: 'AI చెల్లని ప్రతిస్పందనను అందించింది. మీ చివరి పని చేసే సంస్కరణ చూపబడింది.',
    errorAssistant: 'దయచేసి సహాయం చేయడానికి సూచనలను అందించండి.',
    errorFormNotComplete: 'దయచేసి అన్ని ఫీల్డ్‌లను పూరించండి మరియు శైలిని ఎంచుకోండి.',
    formStep1Title: '1. మీ వివరాలు',
    step1Subtitle: 'ఈ వివరాలు మీ కొత్త వెబ్‌సైట్‌లో చూపబడతాయి.',
    step2Title: '2. వ్యాపార వివరణ',
    step2Subtitle: 'మీ వాయిస్‌ని ఉపయోగించండి లేదా ఏ భాషలోనైనా టైప్ చేయండి. మీకు వీలైనంత వివరంగా చెప్పండి!',
    step3Title: '3. శైలి',
    step3Subtitle: 'మీ బ్రాండ్‌కు సరిపోయే రంగుల పాలెట్‌ను ఎంచుకోండి.',
    listening: 'వినడం...',
    startListening: 'వినడం ప్రారంభించండి',
    stopListening: 'వినడం ఆపండి',
    Modern: 'ఆధునిక',
    Vibrant: 'ఉత్సాహపూరితమైన',
    Corporate: 'కార్పొరేట్',
    Elegant: ' taoచితమైనది',
    customizeAndRegenerate: 'అనుకూలీకరించండి & పునరుత్పత్తి చేయండి',
    regenerateButton: 'వెబ్‌సైట్‌ను పునరుత్పత్తి చేయండి',
    aiAssistant: 'AI సహాయకుడు',
    aiAssistantHint: 'నిర్దిష్ట మార్పుల కోసం అడగండి, ఉదా., "సంప్రదింపు విభాగాన్ని మరింత ప్రముఖంగా చేయండి."',
    updateWithAssistant: 'సహాయకుడితో నవీకరించండి',
    yourChanges: 'మార్పులు చేసి పునరుత్పత్తి చేయండి',
    promoteYourSite: 'మీ సైట్‌ను ప్రచారం చేయండి',
    openWebsite: 'వెబ్‌సైట్ తెరవండి',
    copyLink: 'లింక్ కాపీ చేయండి',
    generateNewsletter: 'మార్కెటింగ్ వచనాన్ని రూపొందించండి',
    generatingNewsletter: 'రూపొందిస్తోంది...',
    shareOnWhatsApp: 'WhatsAppలో భాగస్వామ్యం చేయండి',
    pasteInWhatsApp: 'కాపీ చేయబడింది! ఇప్పుడు మీ చాట్‌లో అతికించండి.',
    businessProfile: 'వ్యాపార ప్రొఫైల్',
    todaysVisitors: "నేటి సందర్శకులు",
    campaignLaunches: 'ప్రచార ప్రారంభాలు',
    mostViewedPages: 'అత్యధికంగా వీక్షించిన పేజీలు',
    latestReviews: 'తాజా సమీక్షలు',
    peakTime: 'గరిష్ట సమయం',
    mostViewed: 'అత్యధికంగా వీక్షించినవి',
    upcoming: 'రాబోయే',
    past: 'గత',
    sentiment: 'సెంటిమెంట్',
    positive: 'సానుకూల',
    newCampaign: 'కొత్త ప్రచారం',
    homePage: 'హోమ్ పేజీ',
    aboutPage: 'గురించి పేజీ',
    servicesPage: 'సేవల పేజీ',
    summerSale: 'వేసవి అమ్మకం (జూలై 1న ప్రారంభమవుతుంది)',
    springLaunch: 'వసంత ప్రారంభం (మే 15న పూర్తయింది)',
    dashboardWelcome: 'మీ డాష్‌బోర్డ్‌కు స్వాగతం',
    dashboardPrompt: 'మీ వ్యాపార డేటాను ఇక్కడ చూడటానికి ముందుగా మీ వెబ్‌సైట్‌ను రూపొందించండి.',
    goToGenerator: 'జెనరేటర్‌కు వెళ్లండి',
    aiAnalysis: 'AI విశ్లేషణ',
    aiAnalysisSubtext: 'AI మీ డాష్‌బోర్డ్‌ను విశ్లేషించి, మీరు ఎంచుకున్న భాషలో మాట్లాడే సారాంశాన్ని అందించనివ్వండి.',
    analyzeAndSpeak: 'విశ్లేషించి మాట్లాడండి',
    analyzing: 'విశ్లేషిస్తోంది...',
    stopSpeaking: 'మాట్లాడటం ఆపండి',
    yourWebsite: 'మీ వెబ్‌సైట్ ప్రివ్యూ',
    customizeWebsite: 'వీక్షించండి & అనుకూలీకరించండి',
  },
  'hi-IN': {
    generator: 'जेनरेटर',
    dashboard: 'डैशबोर्ड',
    examples: 'उदाहरण',
    headline1: 'मिनटों में अपनी वेबसाइट बनाएं।',
    subheadline: 'अपने व्यवसाय का वर्णन करें और बाकी काम AI को करने दें। किसी कोडिंग की आवश्यकता नहीं है।',
    speakButtonText: 'अपने व्यवसाय के बारे में बोलने के लिए क्लिक करें',
    generateButton: 'वेबसाइट बनाएं',
    placeholder: 'जैसे, "हम ऑर्गेनिक कॉफी और पेस्ट्री बेचते हैं। मुझे एक आधुनिक डिजाइन चाहिए।"',
    placeholderAssistant: 'जैसे, "हेडलाइन को और बोल्ड बनाएं"',
    yourNamePlaceholder: 'आपका नाम',
    businessNamePlaceholder: 'आपके व्यवसाय का नाम',
    emailPlaceholder: 'आपका व्यावसायिक ईमेल',
    phonePlaceholder: 'आपका व्यावसायिक फ़ोन',
    generating: 'उत्पन्न हो रहा है...',
    loadingMessage: 'AI आपकी वेबसाइट बना रहा है...',
    loadingSubMessage: 'इसमें कुछ समय लग सकता है। महान चीजें आने वाली हैं!',
    startOver: 'पुनः आरंभ करें',
    tryAgain: 'पुनः प्रयास करें',
    preview: 'पूर्वावलोकन',
    code: 'कोड',
    copyCode: 'कोड कॉपी करें',
    copied: 'कॉपी किया गया!',
    download: 'डाउनलोड करें',
    generationFailed: 'पीढ़ी विफल रही',
    updateFailed: 'AI ने एक अमान्य प्रतिक्रिया दी। आपका अंतिम कार्यशील संस्करण दिखाया गया है।',
    errorAssistant: 'कृपया सहायक के लिए निर्देश प्रदान करें।',
    errorFormNotComplete: 'कृपया सभी फ़ील्ड भरें और एक शैली चुनें।',
    formStep1Title: '1. आपका विवरण',
    step1Subtitle: 'ये विवरण आपकी नई वेबसाइट पर दिखाए जाएंगे।',
    step2Title: '2. व्यवसाय विवरण',
    step2Subtitle: 'अपनी आवाज़ का उपयोग करें या किसी भी भाषा में टाइप करें। जितना हो सके उतना वर्णनात्मक बनें!',
    step3Title: '3. शैली',
    step3Subtitle: 'एक रंग पैलेट चुनें जो आपके ब्रांड के अनुकूल हो।',
    listening: 'सुन रहा है...',
    startListening: 'सुनना प्रारंभ करें',
    stopListening: 'सुनना बंद करें',
    Modern: 'आधुनिक',
    Vibrant: 'जीवंत',
    Corporate: 'कॉर्पोरेट',
    Elegant: 'सुरुचिपूर्ण',
    customizeAndRegenerate: 'अनुकूलित करें और पुन: उत्पन्न करें',
    regenerateButton: 'वेबसाइट पुन: उत्पन्न करें',
    aiAssistant: 'एआई सहायक',
    aiAssistantHint: 'विशिष्ट परिवर्तनों के लिए पूछें, उदा., "संपर्क अनुभाग को और प्रमुख बनाएं।"',
    updateWithAssistant: 'सहायक के साथ अपडेट करें',
    yourChanges: 'परिवर्तन करें और पुन: उत्पन्न करें',
    promoteYourSite: 'अपनी साइट का प्रचार करें',
    openWebsite: 'वेबसाइट खोलें',
    copyLink: 'लिंक कॉपी करें',
    generateNewsletter: 'मार्केटिंग टेक्स्ट उत्पन्न करें',
    generatingNewsletter: 'उत्पन्न हो रहा है...',
    shareOnWhatsApp: 'व्हाट्सएप पर साझा करें',
    pasteInWhatsApp: 'कॉपी किया गया! अब अपनी चैट में पेस्ट करें।',
    businessProfile: 'बिजनेस प्रोफाइल',
    todaysVisitors: "आज के आगंतुक",
    campaignLaunches: 'अभियान लॉन्च',
    mostViewedPages: 'सबसे ज्यादा देखे गए पेज',
    latestReviews: 'नवीनतम समीक्षाएं',
    peakTime: 'पीक टाइम',
    mostViewed: 'सबसे ज्यादा देखा गया',
    upcoming: 'आगामी',
    past: 'पिछला',
    sentiment: 'भाव',
    positive: 'सकारात्मक',
    newCampaign: 'नया अभियान',
    homePage: 'होम पेज',
    aboutPage: 'हमारे बारे में पेज',
    servicesPage: 'सेवाएं पेज',
    summerSale: 'ग्रीष्मकालीन सेल (1 जुलाई से शुरू)',
    springLaunch: 'स्प्रिंग लॉन्च (15 मई को पूरा हुआ)',
    dashboardWelcome: 'आपके डैशबोर्ड में आपका स्वागत है',
    dashboardPrompt: 'अपना व्यावसायिक डेटा यहां देखने के लिए पहले अपनी वेबसाइट बनाएं।',
    goToGenerator: 'जेनरेटर पर जाएं',
    aiAnalysis: 'एआई विश्लेषण',
    aiAnalysisSubtext: 'एआई को आपके डैशबोर्ड का विश्लेषण करने दें और आपको आपकी चुनी हुई भाषा में एक मौखिक सारांश दें।',
    analyzeAndSpeak: 'विश्लेषण करें और बोलें',
    analyzing: 'विश्लेषण हो रहा है...',
    stopSpeaking: 'बोलना बंद करो',
    yourWebsite: 'आपकी वेबसाइट का पूर्वावलोकन',
    customizeWebsite: 'देखें और अनुकूलित करें',
  },
};

export const EXAMPLE_PROMPTS = [
  { label: 'Select an example...', prompt: '' },
  { label: 'Coffee Shop', prompt: 'I need a website for my coffee shop in Brooklyn. We sell organic coffee and pastries. I want a modern and minimalist design.' },
  { label: 'Personal Portfolio', prompt: 'Create a personal portfolio for a software developer named Alex Doe. It should have an about section, a projects section, and a contact form.' },
  { label: 'Restaurant', prompt: 'A website for a family-owned Italian restaurant. Include a menu, photos of the food, and a way to book a table.' },
];

export const PROMPT_TEMPLATE = `
You are an expert web developer AI who creates beautiful, single-page websites for non-technical business owners.
The user provides their personal and business details, a business description (in any language), and chooses a color palette. Your task is to generate a complete, responsive, single-page HTML5 website **entirely in English**.

**User Provided Details:**
*   **User's Name:** {USER_NAME}
*   **Business Name:** {BUSINESS_NAME}
*   **Contact Email:** {USER_EMAIL}
*   **Contact Phone:** {USER_PHONE}
*   **Business Description:** "{USER_INPUT}"
*   **Chosen Color Palette:** {PALETTE_NAME}
*   **Color Palette Guidelines:** {PALETTE_DETAILS}
{MODIFICATION_SECTION}

**Critical Instructions:**

1.  **Language & Content:**
    *   Interpret the user's business description, regardless of the original language.
    *   Generate all website text (headings, paragraphs, buttons) in clear, professional **English**.
    *   Create compelling copy for a hero section, an "About Us" section, and a "Services/Products" section based on the user's description.
    *   The "About Us" section can mention the owner, **{USER_NAME}**, by name.

2.  **Modification Handling:**
    *   If a "**Modification Request**" is provided, you **MUST** prioritize it.
    *   This request is an instruction to change the *already generated* website concept.
    *   Apply the modification precisely. For example, if the request is "change the headline to 'Welcome!'", you must change only the main headline text and keep the rest of the website structure, content, and styling as consistent as possible with the original request. Do not treat it as a new prompt for a new website.

3.  **Branding & Contact Info (MANDATORY):**
    *   The website title must be the business name: \`<title>{BUSINESS_NAME}</title>\`.
    *   The business name, **"{BUSINESS_NAME}"**, must be the main heading in the hero section.
    *   Create a "Contact Us" section at the bottom. This section **MUST** display the provided contact details:
        *   Email: **{USER_EMAIL}** (make it a \`mailto:\` link)
        *   Phone: **{USER_PHONE}** (make it a \`tel:\` link)

4.  **Styling with Tailwind CSS (MANDATORY):**
    *   You **MUST** use Tailwind CSS for all styling via the CDN script: \`<script src="https://cdn.tailwindcss.com"></script>\`.
    *   **Strictly follow the user's chosen color palette.** Use the provided guidelines ({PALETTE_DETAILS}) to apply Tailwind color classes. For example, if the primary color is 'bg-indigo-600', use that class for buttons and key elements.
    *   Apply classes directly to HTML elements. **DO NOT** use a '<style>' block.
    *   Ensure the layout is modern, clean, mobile-first, and fully responsive.
    *   Interactive elements (buttons, links) MUST have hover and focus states (e.g., \`hover:bg-indigo-700\`).

5.  **Structure & Images:**
    *   The entire website must be a single HTML file.
    *   You **MUST NOT** use \`<img>\` tags or CSS \`background-image\`. The design must be excellent using only typography, layout, and the chosen color scheme.
    *   Include a simple header with the business name and a simple footer with the contact information and a copyright notice (e.g., © 2024 {BUSINESS_NAME}).

6.  **Final Output Format:**
    *   Return **ONLY** the complete, valid HTML code.
    *   The response must start with \`<!DOCTYPE html>\` and end with \`</html>\`.
    *   Do **NOT** include any markdown (like \`\`\`html\`), commentary, or text outside of the HTML code itself.
`;

export const NEWSLETTER_PROMPT_TEMPLATE = `
You are an expert marketing copywriter. Your task is to generate a short, exciting promotional text message for a business to share on social media like WhatsApp.
The message should be upbeat, use a couple of relevant emojis, and encourage people to visit the new website without providing a direct link.

**Business Details:**
*   **Business Name:** {BUSINESS_NAME}
*   **Description:** "{USER_INPUT}"

**Instructions:**
1.  Keep the message concise and easy to read (around 2-3 sentences).
2.  Start with an exciting hook.
3.  Clearly mention the business name.
4.  Include a strong call-to-action to visit the new website, but **do not include any URLs or placeholders for URLs.** For example, you can say "Find us online!" or "Check out our new website!".
5.  Generate the message in **English**.
6.  Return **ONLY** the message text. Do not include any extra commentary or labels.

Example output:
"🚀 Big news! {BUSINESS_NAME} is now online! Check out our brand new website for amazing offers and find out more about what we do. See you there!"
`;

export const DASHBOARD_ANALYSIS_PROMPT_TEMPLATE = `
You are an expert business analyst AI. Your task is to analyze the provided dashboard data for a business and generate a concise summary.
This summary must be in the user's requested language. Based on the data, you should also provide one key insight or actionable suggestion.

**Dashboard Data Snapshot:**
{DASHBOARD_DATA}

**User Language Details:**
* Language Name: {LANGUAGE_NAME}
* Language Code: {LANGUAGE_CODE}

**CRITICAL INSTRUCTIONS:**
1.  Your entire response **MUST** be in the requested language ({LANGUAGE_NAME}).
2.  The tone should be professional but encouraging.
3.  Start with a greeting acknowledging the business name.
4.  Summarize the key metrics provided.
5.  End with one clear, actionable piece of advice based on the data.
6.  Return **ONLY** the translated text. Do not include any English, markdown, or other text if the requested language is not English.
`;