import React, { useContext } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppProvider, AppContext } from './AppContext';
import { generateWebsite } from '@/features/generation/geminiService';

// Mock geminiService API
vi.mock('@/features/generation/geminiService', () => ({
  generateWebsite: vi.fn(),
  generateNewsletter: vi.fn(),
}));

const TestComponent: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return <div>No Context</div>;

  return (
    <div>
      <div data-testid="privacyMode">{context.privacyMode || 'none'}</div>
      <div data-testid="userName">{context.userName}</div>
      <div data-testid="businessName">{context.businessName}</div>
      <div data-testid="prompt">{context.prompt}</div>
      <div data-testid="pageState">{context.pageState}</div>
      <div data-testid="error">{context.error || 'none'}</div>
      <div data-testid="generatedUrl">{context.generatedUrl || 'none'}</div>
      <div data-testid="translatedText">{context.t('headline1')}</div>
      <div data-testid="translatedFailed">{context.t('updateFailed')}</div>
      
      <button onClick={() => context.setPrivacyMode('local')} data-testid="setPrivacyLocal">Set Privacy Local</button>
      <button onClick={() => {
        context.setUserName('Alice');
        context.setBusinessName('Alice Bakery');
        context.setUserEmail('alice@bakery.com');
        context.setUserPhone('123456');
        context.setPrompt('Best bakery in town');
        context.setSelectedPalette('Lime Fresh');
      }} data-testid="fillForm">Fill Form</button>
      <button onClick={context.handleGenerate} data-testid="generate">Generate</button>
      <button onClick={context.reset} data-testid="reset">Reset</button>
      <input
        type="text"
        value={context.modificationPrompt}
        onChange={(e) => context.setModificationPrompt(e.target.value)}
        data-testid="modInput"
      />
      <button onClick={context.handleAssist} data-testid="assist">Assist</button>
      <button onClick={context.handleGenerateNewsletter} data-testid="newsletter">Newsletter</button>
      <button onClick={context.handleRetry} data-testid="retry">Retry</button>
      <button onClick={context.reviewPrivacyChoice} data-testid="reviewPrivacy">Review Privacy</button>
      <button onClick={context.clearPrivateData} data-testid="clearPrivate">Clear Private</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default states', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('privacyMode').textContent).toBe('none');
    expect(screen.getByTestId('userName').textContent).toBe('');
    expect(screen.getByTestId('businessName').textContent).toBe('');
    expect(screen.getByTestId('pageState').textContent).toBe('form');
  });

  it('should set privacy mode and persist in localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('setPrivacyLocal'));
    expect(screen.getByTestId('privacyMode').textContent).toBe('local');
    
    // Check localStorage
    const saved = localStorage.getItem('digital-ally-privacy-preference');
    expect(saved).toContain('local');
  });

  it('should return correct translation keys via t()', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // By default it's English
    expect(screen.getByTestId('translatedText').textContent).not.toBe('headline1');
    expect(screen.getByTestId('translatedText').textContent).toContain('Build Your Website in Minutes.');
  });

  it('should prevent generation if form is incomplete', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('generate'));
    
    // Should display validation error
    expect(screen.getByTestId('error').textContent).not.toBe('none');
    expect(screen.getByTestId('pageState').textContent).toBe('form');
  });

  it('should execute website generation when form is completed in remote mode', async () => {
    vi.mocked(generateWebsite).mockResolvedValue('<!doctype html><html><body>Alice Bakery</body></html>');

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('fillForm'));
    fireEvent.click(screen.getByTestId('generate'));

    expect(screen.getByTestId('pageState').textContent).toBe('loading');

    await waitFor(() => {
      expect(screen.getByTestId('pageState').textContent).toBe('result');
      expect(screen.getByTestId('generatedUrl').textContent).toContain('data:text/html');
    });
  });

  it('should reset all states on reset call', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('fillForm'));
    expect(screen.getByTestId('userName').textContent).toBe('Alice');

    fireEvent.click(screen.getByTestId('reset'));
    expect(screen.getByTestId('userName').textContent).toBe('');
    expect(screen.getByTestId('businessName').textContent).toBe('');
  });

  it('should support assistant, newsletter, retry and privacy calls', async () => {
    vi.mocked(generateWebsite).mockResolvedValue('<!doctype html><html><body>Alice Bakery</body></html>');

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('fillForm'));
    fireEvent.click(screen.getByTestId('generate'));

    await waitFor(() => {
      expect(screen.getByTestId('pageState').textContent).toBe('result');
    });

    // Test assistant flow
    fireEvent.change(screen.getByTestId('modInput'), { target: { value: 'make it blue' } });
    fireEvent.click(screen.getByTestId('assist'));
    await waitFor(() => {
      expect(generateWebsite).toHaveBeenCalledTimes(2);
    });

    // Test newsletter generation
    fireEvent.click(screen.getByTestId('newsletter'));
    
    // Test retry limits
    fireEvent.click(screen.getByTestId('retry'));

    // Test privacy modifiers
    fireEvent.click(screen.getByTestId('reviewPrivacy'));
    expect(screen.getByTestId('privacyMode').textContent).toBe('none');

    fireEvent.click(screen.getByTestId('clearPrivate'));
    expect(screen.getByTestId('userName').textContent).toBe('');
  });
});
