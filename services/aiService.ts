
import * as geminiService from './geminiService';
import * as claudeService from './claudeService';

export type AIProvider = 'gemini' | 'claude';

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

export async function generateWebsite(
    params: WebsiteParams,
    provider: AIProvider = 'gemini'
): Promise<string> {
    if (provider === 'claude') {
        return claudeService.generateWebsite(params);
    }
    return geminiService.generateWebsite(params);
}

export async function generateNewsletter(
    params: NewsletterParams,
    provider: AIProvider = 'gemini'
): Promise<string> {
    if (provider === 'claude') {
        return claudeService.generateNewsletter(params);
    }
    return geminiService.generateNewsletter(params);
}

export async function analyzeAndTranslateDashboard(
    params: DashboardAnalysisParams,
    provider: AIProvider = 'gemini'
): Promise<string> {
    if (provider === 'claude') {
        return claudeService.analyzeAndTranslateDashboard(params);
    }
    return geminiService.analyzeAndTranslateDashboard(params);
}
