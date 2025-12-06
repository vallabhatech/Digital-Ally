

import { GoogleGenAI } from "@google/genai";
import { PROMPT_TEMPLATE, NEWSLETTER_PROMPT_TEMPLATE, DASHBOARD_ANALYSIS_PROMPT_TEMPLATE, LANGUAGES } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

interface WebsiteParams {
    description: string;
    userName: string;
    businessName: string;
    userEmail: string;
    userPhone: string;
    paletteName: string;
    paletteDetails: string;
    modificationPrompt?: string;
}

interface NewsletterParams {
    description: string;
    businessName: string;
}

interface DashboardAnalysisParams {
    dashboardData: string;
    language: string;
}

const cleanResponse = (text: string): string => {
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```html')) {
        cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
    } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
    }
    return cleanedText;
}

export async function generateWebsite(
    { description, userName, businessName, userEmail, userPhone, paletteName, paletteDetails, modificationPrompt }: WebsiteParams
): Promise<string> {
  try {
    const modificationSection = modificationPrompt
      ? `\n**Modification Request:** "${modificationPrompt}"`
      : '';

    const textPrompt = PROMPT_TEMPLATE
        .replace('{USER_NAME}', userName)
        .replace('{BUSINESS_NAME}', businessName)
        .replace('{USER_EMAIL}', userEmail)
        .replace('{USER_PHONE}', userPhone)
        .replace('{USER_INPUT}', description)
        .replace('{PALETTE_NAME}', paletteName)
        .replace('{PALETTE_DETAILS}', paletteDetails)
        .replace('{MODIFICATION_SECTION}', modificationSection);

    const websiteResponse = await ai.models.generateContent({
      model: model,
      contents: textPrompt,
       config: {
        temperature: 0.7, 
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const generatedHtml = cleanResponse(websiteResponse.text);
    return generatedHtml;

  } catch (error) {
    console.error("Error during website generation process:", error);
    if (error instanceof Error) {
        if (error.message.includes('400')) {
            throw new Error('The generated prompt is too large. Please try a shorter description.');
        }
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}

export async function generateNewsletter(
    { description, businessName }: NewsletterParams
): Promise<string> {
    try {
        const finalPrompt = NEWSLETTER_PROMPT_TEMPLATE
            .replace('{BUSINESS_NAME}', businessName)
            .replace('{USER_INPUT}', description);

        const newsletterResponse = await ai.models.generateContent({
            model: model,
            contents: finalPrompt,
            config: {
                temperature: 0.8,
                topP: 0.95,
            }
        });

        return cleanResponse(newsletterResponse.text);

    } catch(error) {
        console.error("Error during newsletter generation:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the newsletter.");
    }
}

export async function analyzeAndTranslateDashboard(
    { dashboardData, language }: DashboardAnalysisParams
): Promise<string> {
    try {
        const langDetails = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];
        const finalPrompt = DASHBOARD_ANALYSIS_PROMPT_TEMPLATE
            .replace('{DASHBOARD_DATA}', dashboardData)
            .replace('{LANGUAGE_NAME}', langDetails.label)
            .replace('{LANGUAGE_CODE}', langDetails.value);

        const analysisResponse = await ai.models.generateContent({
            model: model,
            contents: finalPrompt,
            config: {
                temperature: 0.5,
            }
        });
        
        return cleanResponse(analysisResponse.text);

    } catch (error) {
        console.error("Error during dashboard analysis:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while analyzing the dashboard.");
    }
}