import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { observer } from 'mobx-react-lite';

const TickDataContext = createContext(null);

export const TickDataProvider = observer(({ children }) => {
    const { chart } = useStore();
    const [ticks, setTicks] = useState([]);
    const [symbol, setSymbol] = useState('R_100');

    // Use a mock interval to simulate real-time data if actual hook is complex
    useEffect(() => {
        const interval = setInterval(() => {
            const newTick = { quote: (Math.random() * 1000).toFixed(2), epoch: Date.now() };
            setTicks(prev => [...prev.slice(-99), newTick]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <TickDataContext.Provider value={{ ticks, isConnected: true, symbol, setSymbol }}>
            {children}
        </TickDataContext.Provider>
    );
});

export const useTickData = () => useContext(TickDataContext);
