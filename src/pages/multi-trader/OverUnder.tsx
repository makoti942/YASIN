import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api_base } from '@/external/bot-skeleton';
import './over-under.scss';

const OverUnder = () => {
    const [volatility, setVolatility] = useState('R_100');
    const [stake, setStake] = useState(1.0);
    const [isBotRunning, setIsBotRunning] = useState(false);
    const [logs, setLogs] = useState([]);
    const api = api_base.api; // Use the shared API instance
    const subscriptionRef = useRef(null);

    const addLog = (message) => {
        setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const startBot = useCallback(async () => {
        if (!api) {
            addLog('Deriv API not connected.');
            return;
        }

        addLog(`Subscribing to ${volatility}...`);

        try {
            subscriptionRef.current = await api.ticks(volatility).on('data', async (tick) => {
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
                                barrier: 4
                            }
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
                                barrier: 5
                            }
                        });
                        addLog('Placed OVER 5 contract successfully.');

                    } catch (error) {
                        addLog(`Error placing trades: ${error.message}`);
                    }
                }
            });

            addLog('Bot is running...');
            setIsBotRunning(true);
        } catch (error) {
            addLog(`Error subscribing to ticks: ${error.message}`);
        }
    }, [api, volatility, stake]);

    const stopBot = () => {
        if (subscriptionRef.current) {
            addLog('Stopping bot...');
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
            setIsBotRunning(false);
            addLog('Bot stopped.');
        }
    };

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
    }, []);

    return (
        <div className="over-under">
            <h2>OVER UNDER</h2>
            <div className="over-under__controls">
                <label>
                    Select Volatility Index:
                    <select value={volatility} onChange={(e) => setVolatility(e.target.value)}>
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
                        onChange={(e) => setStake(parseFloat(e.target.value))}
                        step="0.01"
                    />
                </label>
                <button onClick={handleToggleBot}>
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
