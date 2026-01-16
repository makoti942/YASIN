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
    const [digitsData, setDigitsData] = useState(Array(10).fill(10)); 
    const [currentDigit, setCurrentDigit] = useState(null);

    useEffect(() => {
        const ws = window.derivWS; 
        if (!ws) return;

        const onMessage = (event) => {
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

        ws.send(JSON.stringify({ ticks: volatility, subscribe: 1 }));
        ws.addEventListener('message', onMessage);

        return () => {
            ws.removeEventListener('message', onMessage);
            ws.send(JSON.stringify({ forget_all: 'ticks' }));
        };
    }, [volatility]);

    // This logic forces percentages to stay between 8% and 12%
    const stats = useMemo(() => {
        const total = digitsData.reduce((a, b) => a + b, 0);
        const rawPercentages = digitsData.map(count => (count / total) * 100);
        
        const minRaw = Math.min(...rawPercentages);
        const maxRaw = Math.max(...rawPercentages);

        // Map the raw percentages to the 8% - 12% range
        return rawPercentages.map(p => {
            if (maxRaw === minRaw) return 10.00; // Default if all equal
            const mapped = 8 + ((p - minRaw) * (12 - 8)) / (maxRaw - minRaw);
            return parseFloat(mapped.toFixed(2));
        });
    }, [digitsData]);

    // Identify which mapped values are the highest and lowest for coloring
    const maxVal = Math.max(...stats);
    const minVal = Math.min(...stats);

    return (
        <div className='dcircles-container'>
            <div className='header-row'>
                <select 
                    className='volatility-dropdown'
                    value={volatility} 
                    onChange={(e) => {
                        setVolatility(e.target.value);
                        setDigitsData(Array(10).fill(10));
                        setCurrentDigit(null);
                    }}
                >
                    {volatilities.map((vol) => (
                        <option key={vol.id} value={vol.id}>{vol.name}</option>
                    ))}
                </select>
            </div>

            <div className='stats-grid'>
                {stats.map((percentage, digit) => {
                    // Highest % in the group gets Green, Lowest gets Red
                    let statusClass = '';
                    if (percentage === maxVal && maxVal !== minVal) statusClass = 'max-green';
                    else if (percentage === minVal && maxVal !== minVal) statusClass = 'min-red';

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
