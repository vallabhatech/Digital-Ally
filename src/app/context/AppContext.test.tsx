import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppProvider } from './AppContext';

describe('AppProvider', () => {
  it('renders children without requiring a React context state container', () => {
    render(
      <AppProvider>
        <p>child content</p>
      </AppProvider>
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
