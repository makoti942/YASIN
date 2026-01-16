import React, { useState, useEffect, useMemo } from 'react';
import './dcircles.scss';

const Dcircles = () => {
    // Volatility options including "1s" indices
    const volatilities = [
        { id: '10', name: 'Volatility 10 Index' },
        { id: '10s', name: 'Volatility 10 (1s) Index' },
        { id: '25', name: 'Volatility 25 Index' },
        { id: '25s', name: 'Volatility 25 (1s) Index' },
        { id: '50', name: 'Volatility 50 Index' },
        { id: '75', name: 'Volatility 75 Index' },
        { id: '100', name: 'Volatility 100 Index' },
        { id: '100s', name: 'Volatility 100 (1s) Index' },
    ];

    const [volatility, setVolatility] = useState('10s');
    const [digitsData, setDigitsData] = useState(Array(10).fill(10)); // Initial weight
    const [currentDigit, setCurrentDigit] = useState(0);

    useEffect(() => {
        // Speed logic: 1s indices update every 1000ms
        const speed = volatility.includes('s') ? 1000 : 2000;

        const interval = setInterval(() => {
            const nextDigit = Math.floor(Math.random() * 10);
            setCurrentDigit(nextDigit);
            
            setDigitsData(prev => {
                const newData = [...prev];
                newData[nextDigit] += 1;
                return newData;
            });
        }, speed);

        return () => clearInterval(interval);
    }, [volatility]);

    // Calculate percentages with 1 decimal place
    const stats = useMemo(() => {
        const total = digitsData.reduce((a, b) => a + b, 0);
        return digitsData.map(count => parseFloat(((count / total) * 100).toFixed(1)));
    }, [digitsData]);

    return (
        <div className='dcircles-container'>
            {/* Volatility Selection Dropdown */}
            <div className='selector-area'>
                <select 
                    className='volatility-dropdown'
                    value={volatility} 
                    onChange={(e) => {
                        setVolatility(e.target.value);
                        setDigitsData(Array(10).fill(10)); // Reset analysis on change
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
                    // Logic: 8% (Red) to 12% (Green)
                    let statusClass = '';
                    if (percentage >= 12) statusClass = 'max-green';
                    else if (percentage <= 8) statusClass = 'min-red';

                    return (
                        <div key={digit} className="digit-column">
                            {/* The Arrow Cursor */}
                            <div className={`arrow-cursor ${currentDigit === digit ? 'visible' : ''}`}>
                                🔽
                            </div>

                            <div className={`circle-digit ${statusClass}`}>
                                {digit}
                            </div>

                            <div className={`percentage-label ${statusClass}`}>
                                {percentage.toFixed(1)}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dcircles;
