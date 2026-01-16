import React, { useState, useEffect, useMemo } from 'react';
import './dcircles.scss';

// These IDs must match exactly what your existing WebSocket uses for symbols
const volatilities = [
    { id: 'R_10', name: 'Volatility 10 Index' },
    { id: '1HZ10V', name: 'Volatility 10 (1s) Index' },
    { id: 'R_25', name: 'Volatility 25 Index' },
    { id: '1HZ25V', name: 'Volatility 25 (1s) Index' },
    { id: 'R_50', name: 'Volatility 50 Index' },
    { id: 'R_100', name: 'Volatility 100 Index' },
    { id: '1HZ100V', name: 'Volatility 100 (1s) Index' },
];

const Dcircles = () => {
    const [volatility, setVolatility] = useState('1HZ10V');
    const [digitsData, setDigitsData] = useState(Array(10).fill(0)); // Start at 0
    const [currentDigit, setCurrentDigit] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Access your global websocket instance
        // Replace 'window.derivWS' with whatever your global socket variable is named
        const ws = window.derivWS; 

        if (!ws) {
            console.error("WebSocket instance not found!");
            return;
        }

        const onMessage = (event) => {
            const data = JSON.parse(event.data);

            // Handle the 'tick' message from Deriv
            if (data.msg_type === 'tick' && data.tick) {
                setIsConnected(true);
                const quote = data.tick.quote.toString();
                const lastDigit = parseInt(quote.slice(-1));

                setCurrentDigit(lastDigit);
                setDigitsData(prev => {
                    const next = [...prev];
                    next[lastDigit] += 1;
                    return next;
                });
            }
        };

        // Subscribe to the tick stream
        const subscribeTick = () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    ticks: volatility,
                    subscribe: 1
                }));
            }
        };

        ws.addEventListener('message', onMessage);
        subscribeTick();

        // Cleanup: Forget the stream when switching symbols or unmounting
        return () => {
            ws.removeEventListener('message', onMessage);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ forget_all: 'ticks' }));
            }
        };
    }, [volatility]);

    // Precise math for 2 decimal places
    const stats = useMemo(() => {
        const total = digitsData.reduce((a, b) => a + b, 0);
        if (total === 0) return Array(10).fill(10.00); // Default placeholder
        return digitsData.map(count => parseFloat(((count / total) * 100).toFixed(2)));
    }, [digitsData]);

    return (
        <div className='dcircles-container'>
            <div className='header-row'>
                <select 
                    className='volatility-dropdown'
                    value={volatility} 
                    onChange={(e) => {
                        setVolatility(e.target.value);
                        setDigitsData(Array(10).fill(0)); // Reset count for new volatility
                        setCurrentDigit(null);
                    }}
                >
                    {volatilities.map((vol) => (
                        <option key={vol.id} value={vol.id}>{vol.name}</option>
                    ))}
                </select>
                <div className={`status-dot ${isConnected ? 'online' : 'offline'}`}>
                    {isConnected ? 'Live Data' : 'Connecting...'}
                </div>
            </div>

            <div className='stats-grid'>
                {stats.map((percentage, digit) => {
                    let statusClass = '';
                    if (percentage >= 12) statusClass = 'max-green';
                    else if (percentage <= 8) statusClass = 'min-red';

                    return (
                        <div key={digit} className="digit-column">
                            <div className={`arrow-cursor ${currentDigit === digit ? 'visible' : ''}`}>
                                🔽
                            </div>
                            <div className={`circle-digit ${statusClass} ${currentDigit === digit ? 'active' : ''}`}>
                                {digit}
                            </div>
                            <div className={`percentage-label ${statusClass}`}>
                                {percentage.toFixed(2)}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dcircles;
