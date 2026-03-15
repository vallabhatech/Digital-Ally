import React from 'react';
import { InputPanel } from '../components/InputPanel';

export const HomePage: React.FC = () => {
    console.log('HomePage rendering...');
    try {
        return <InputPanel />;
    } catch (error) {
        console.error('HomePage error:', error);
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <h1>HomePage Error</h1>
                <p>{error.message}</p>
            </div>
        );
    }
};
