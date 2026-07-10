import { createContext } from 'react';
import type { AppContextType } from '@/shared/types';

export const AppContext = createContext<AppContextType | null>(null);
export const AppProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
