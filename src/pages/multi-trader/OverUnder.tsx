import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api_base } from '@/external/bot-skeleton';
import './over-under.scss';

// Define a type for the tick data from the API
interface TickData {
    quote: number;
    epoch: number;
    // Add other properties if they exist in the tick data
}

const OverUnder = () => {
    const [volatility, setVolatility] = useState('R_100');
    const [stake, setStake] = useState(1.0);
    const [isBotRunning, setIsBotRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const api = api_base.api; // Use the shared API instance
    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

    const addLog = (message: string) => {
        setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const startBot = useCallback(async () => {
        if (!api) {
            addLog('Deriv API is not connected.');
            return;
        }

        if (!api.ticks) {
            addLog('Ticks subscription service is not available.');
            return;
        }

        addLog(`Subscribing to ${volatility}...`);

        try {
            const subscription = api.ticks(volatility);
            subscriptionRef.current = subscription.on('data', async (tick: TickData) => {
                if (!tick || typeof tick.quote !== 'number') return;

                const lastDigit = tick.quote % 10;
                addLog(`New tick: ${tick.quote}, Last digit: ${lastDigit}`);

                if (lastDigit === 4 || lastDigit === 5) {
                    addLog('Entry condition met. Placing trades...');
                    try {
                        await api.buy({
                            buy: '1',
                            price: stake,
                            parameters: {
                                amount: stake,
                                basis: 'stake',
                                contract_type: 'DIGITUNDER',
                                currency: 'USD',
                                duration: 1,
                                duration_unit: 't',
                                symbol: volatility,
                                barrier: 4,
                            },
                        });
                        addLog('Placed UNDER 4 contract successfully.');

                        await api.buy({
                            buy: '1',
                            price: stake,
                            parameters: {
                                amount: stake,
                                basis: 'stake',
                                contract_type: 'DIGITOVER',
                                currency: 'USD',
                                duration: 1,
                                duration_unit: 't',
                                symbol: volatility,
                                barrier: 5,
                            },
                        });
                        addLog('Placed OVER 5 contract successfully.');
                    } catch (error: any) {
                        addLog(`Error placing trades: ${error?.message || 'Unknown error'}`);
                    }
                }
            });

            addLog('Bot is running...');
            setIsBotRunning(true);
        } catch (error: any) {
            addLog(`Error subscribing to ticks: ${error?.message || 'Unknown error'}`);
        }
    }, [api, volatility, stake]);

    const stopBot = useCallback(() => {
        if (subscriptionRef.current) {
            addLog('Stopping bot...');
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
            setIsBotRunning(false);
            addLog('Bot stopped.');
        }
    }, []);

    const handleToggleBot = () => {
        if (isBotRunning) {
            stopBot();
        } else {
            startBot();
        }
    };

    useEffect(() => {
        // Stop the bot when the component unmounts
        return () => {
            stopBot();
        };
    }, [stopBot]);

    return (
        <div className="over-under">
            <h2>OVER UNDER</h2>
            <div className="over-under__controls">
                <label>
                    Select Volatility Index:
                    <select value={volatility} onChange={e => setVolatility(e.target.value)}>
                        <option value="R_10">Volatility 10 Index</option>
                        <option value="R_25">Volatility 25 Index</option>
                        <option value="R_50">Volatility 50 Index</option>
                        <option value="R_75">Volatility 75 Index</option>
                        <option value="R_100">Volatility 100 Index</option>
                        <option value="R_150">Volatility 150 Index</option>
                        <option value="R_200">Volatility 200 Index</option>
                        <option value="R_250">Volatility 250 Index</option>
                        <option value="R_300">Volatility 300 Index</option>
                    </select>
                </label>
                <label>
                    Stake (USD):
                    <input
                        type="number"
                        value={stake}
                        onChange={e => setStake(parseFloat(e.target.value))}
                        step="0.01"
                        min="0.35"
                    />
                </label>
                <button onClick={handleToggleBot} disabled={!api}>
                    {isBotRunning ? 'Stop Trading Bot' : 'Run Trading Bot'}
                </button>
            </div>
            <div className="over-under__logs">
                {logs.map((log, index) => (
                    <div key={index}>{log}</div>
                ))}
            </div>
        </div>
    );
};

export default OverUnder;
