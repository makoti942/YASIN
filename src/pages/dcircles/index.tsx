import React, { useState, useEffect, useMemo } from 'react';
import './dcircles.scss';

// Use the actual Deriv Symbol names for the API
const volatilities = [
    { id: 'R_10', name: 'Volatility 10 Index' },
    { id: '1HZ10V', name: 'Volatility 10 (1s) Index' },
    { id: 'R_25', name: 'Volatility 25 Index' },
    { id: '1HZ25V', name: 'Volatility 25 (1s) Index' },
    { id: 'R_50', name: 'Volatility 50 Index' },
    { id: 'R_100', name: 'Volatility 100 Index' },
    { id: '1HZ100V', name: 'Volatility 100 (1s) Index' },
];

const Dcircles = ({ sharedWs }) => { // Assuming ws is passed as a prop or global
    const [volatility, setVolatility] = useState('1HZ10V');
    const [digitsData, setDigitsData] = useState(Array(10).fill(1)); 
    const [currentDigit, setCurrentDigit] = useState(null);

    useEffect(() => {
        // 1. Function to handle incoming tick data
        const handleTick = (event) => {
            const data = JSON.parse(event.data);
            
            // Check if the message is a tick and matches our selected symbol
            if (data.msg_type === 'tick' && data.tick.symbol === volatility) {
                const quote = data.tick.quote.toString();
                const lastDigit = parseInt(quote.charAt(quote.length - 1));
                
                setCurrentDigit(lastDigit);
                setDigitsData(prev => {
                    const newData = [...prev];
                    newData[lastDigit] += 1;
                    return newData;
                });
            }
        };

        // 2. Subscribe to the selected symbol
        // This assumes your sharedWs is the active WebSocket instance
        if (sharedWs && sharedWs.readyState === WebSocket.OPEN) {
            sharedWs.send(JSON.stringify({
                ticks: volatility,
                subscribe: 1
            }));
            
            sharedWs.addEventListener('message', handleTick);
        }

        // 3. Cleanup: Unsubscribe when switching or closing
        return () => {
            if (sharedWs) {
                sharedWs.send(JSON.stringify({ forget_all: 'ticks' }));
                sharedWs.removeEventListener('message', handleTick);
            }
        };
    }, [volatility, sharedWs]);

    const stats = useMemo(() => {
        const total = digitsData.reduce((a, b) => a + b, 0);
        return digitsData.map(count => parseFloat(((count / total) * 100).toFixed(2)));
    }, [digitsData]);

    return (
        <div className='dcircles-container'>
            <div className='selector-area'>
                <select 
                    className='volatility-dropdown'
                    value={volatility} 
                    onChange={(e) => {
                        setVolatility(e.target.value);
                        setDigitsData(Array(10).fill(1)); // Reset stats for fresh analysis
                        setCurrentDigit(null);
                    }}
                >
                    {volatilities.map((vol) => (
                        <option key={vol.id} value={vol.id}>
                            {vol.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className='stats-grid'>
                {stats.map((percentage, digit) => {
                    // Logic: 8% (Red/Least) and 12% (Green/Most)
                    let statusClass = '';
                    if (percentage >= 12) statusClass = 'max-green';
                    else if (percentage <= 8) statusClass = 'min-red';

                    return (
                        <div key={digit} className="digit-column">
                            {/* The Arrow Cursor (Points only to current digit) */}
                            <div className={`arrow-cursor ${currentDigit === digit ? 'visible' : ''}`}>
                                🔽
                            </div>

                            <div className={`circle-digit ${statusClass} ${currentDigit === digit ? 'active-glow' : ''}`}>
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
