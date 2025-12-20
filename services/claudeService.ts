

import Anthropic from "@anthropic-ai/sdk";
import { PROMPT_TEMPLATE, NEWSLETTER_PROMPT_TEMPLATE, DASHBOARD_ANALYSIS_PROMPT_TEMPLATE, LANGUAGES } from '../constants';

const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable not set.");
}

const anthropic = new Anthropic({ apiKey: API_KEY });
const model = "claude-3-5-sonnet-20241022";

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

    const websiteResponse = await anthropic.messages.create({
      model: model,
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: textPrompt
      }]
    });

    const generatedHtml = cleanResponse(websiteResponse.content[0].type === 'text' ? websiteResponse.content[0].text : '');
    return generatedHtml;

  } catch (error) {
    console.error("Error during website generation process:", error);
    if (error instanceof Error) {
        if (error.message.includes('400')) {
            throw new Error('The generated prompt is too large. Please try a shorter description.');
        }
        throw new Error(`Claude API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Claude API.");
  }
}

export async function generateNewsletter(
    { description, businessName }: NewsletterParams
): Promise<string> {
    try {
        const finalPrompt = NEWSLETTER_PROMPT_TEMPLATE
            .replace('{BUSINESS_NAME}', businessName)
            .replace('{USER_INPUT}', description);

        const newsletterResponse = await anthropic.messages.create({
            model: model,
            max_tokens: 2048,
            temperature: 0.8,
            messages: [{
                role: "user",
                content: finalPrompt
            }]
        });

        return cleanResponse(newsletterResponse.content[0].type === 'text' ? newsletterResponse.content[0].text : '');

    } catch(error) {
        console.error("Error during newsletter generation:", error);
        if (error instanceof Error) {
            throw new Error(`Claude API Error: ${error.message}`);
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

        const analysisResponse = await anthropic.messages.create({
            model: model,
            max_tokens: 1024,
            temperature: 0.5,
            messages: [{
                role: "user",
                content: finalPrompt
            }]
        });
        
        return cleanResponse(analysisResponse.content[0].type === 'text' ? analysisResponse.content[0].text : '');

    } catch (error) {
        console.error("Error during dashboard analysis:", error);
        if (error instanceof Error) {
            throw new Error(`Claude API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while analyzing the dashboard.");
    }
}
