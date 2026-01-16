import React, { useState, useEffect, useMemo } from 'react';
import './dcircles.scss';

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
    const [digitsData, setDigitsData] = useState(Array(10).fill(10)); // Initial baseline
    const [currentDigit, setCurrentDigit] = useState(null);

    useEffect(() => {
        // Reference your existing site WebSocket
        const ws = window.ws || window.derivWS; 

        if (!ws) return;

        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.msg_type === 'tick' && data.tick.symbol === volatility) {
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

        // Subscription logic
        if (ws.readyState === 1) {
            ws.send(JSON.stringify({ ticks: volatility, subscribe: 1 }));
        }

        ws.addEventListener('message', handleMessage);

        return () => {
            ws.removeEventListener('message', handleMessage);
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({ forget_all: 'ticks' }));
            }
        };
    }, [volatility]);

    // Math logic: Map raw frequency to a strict 8.00% - 12.00% range
    const stats = useMemo(() => {
        const total = digitsData.reduce((a, b) => a + b, 0);
        const raw = digitsData.map(count => (count / total) * 100);
        const minR = Math.min(...raw);
        const maxR = Math.max(...raw);

        return raw.map(p => {
            if (maxR === minR) return 10.00;
            // Linear transformation to [8, 12] range
            const mapped = 8 + ((p - minR) * (12 - 8)) / (maxR - minR);
            return parseFloat(mapped.toFixed(2));
        });
    }, [digitsData]);

    const maxVal = Math.max(...stats);
    const minVal = Math.min(...stats);

    return (
        <div className='dcircles-container'>
            <div className='vol-selector-wrapper'>
                <select 
                    className='deriv-dropdown'
                    value={volatility} 
                    onChange={(e) => {
                        setVolatility(e.target.value);
                        setDigitsData(Array(10).fill(10)); // Reset stats
                        setCurrentDigit(null);
                    }}
                >
                    {volatilities.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                </select>
            </div>

            <div className='circles-layout'>
                {stats.map((percentage, digit) => {
                    // Highest % = Green, Lowest % = Red
                    let colorClass = '';
                    if (percentage === maxVal && maxVal !== minVal) colorClass = 'is-most';
                    else if (percentage === minVal && maxVal !== minVal) colorClass = 'is-least';

                    return (
                        <div key={digit} className="digit-unit">
                            <div className={`arrow-indicator ${currentDigit === digit ? 'active' : ''}`}>
                                🔽
                            </div>
                            <div className={`circle-shape ${colorClass} ${currentDigit === digit ? 'hitting' : ''}`}>
                                {digit}
                            </div>
                            <div className={`percent-label ${colorClass}`}>
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
