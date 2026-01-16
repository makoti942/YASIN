import React, { useState, useEffect, useMemo } from 'react';
import './dcircles.scss';

const Dcircles = () => {
    // List of volatilities including "1s" indices
    const volatilities = [
        { id: '10', name: 'Vol 10' },
        { id: '10s', name: 'Vol 10 (1s)' },
        { id: '25', name: 'Vol 25' },
        { id: '25s', name: 'Vol 25 (1s)' },
        { id: '50', name: 'Vol 50' },
        { id: '75', name: 'Vol 75' },
        { id: '100', name: 'Vol 100' },
        { id: '100s', name: 'Vol 100 (1s)' },
    ];

    const [volatility, setVolatility] = useState('10s');
    const [digitsData, setDigitsData] = useState(Array(10).fill(10)); 
    const [currentDigit, setCurrentDigit] = useState(0);

    useEffect(() => {
        // Determine speed: 1s indices move at 1000ms, others slightly slower
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

    // Precise math to ensure decimals add to 100%
    const stats = useMemo(() => {
        const total = digitsData.reduce((a, b) => a + b, 0);
        return digitsData.map(count => parseFloat(((count / total) * 100).toFixed(1)));
    }, [digitsData]);

    return (
        <div className='dcircles-container'>
            {/* Volatility Selection Tabs/Buttons */}
            <div className='volatility-selector'>
                {volatilities.map((vol) => (
                    <button 
                        key={vol.id}
                        className={volatility === vol.id ? 'active' : ''}
                        onClick={() => {
                            setVolatility(vol.id);
                            setDigitsData(Array(10).fill(10)); // Reset stats on switch
                        }}
                    >
                        {vol.name}
                    </button>
                ))}
            </div>

            <div className='stats-grid'>
                {stats.map((percentage, digit) => {
                    // Your requested Logic: 8% floor (Red), 12% ceiling (Green)
                    let statusClass = '';
                    if (percentage >= 12) statusClass = 'max-green';
                    else if (percentage <= 8) statusClass = 'min-red';

                    return (
                        <div key={digit} className="digit-column">
                            {/* The Arrow Cursor */}
                            <div className={`arrow-cursor ${currentDigit === digit ? 'visible' : ''}`}>
                                🔽
                            </div>

                            <div className={`circle-digit ${statusClass} ${currentDigit === digit ? 'highlight-border' : ''}`}>
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
