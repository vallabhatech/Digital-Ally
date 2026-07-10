import { createContext } from 'react';

export const AppContext = createContext<any>({});
export const AppProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;