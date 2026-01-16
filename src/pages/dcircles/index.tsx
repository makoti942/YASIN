import React, { useState, useEffect } from 'react';
import './dcircles.scss';

const Dcircles = () => {
    const [stats, setStats] = useState(Array(10).fill(0).map(() => Math.floor(Math.random() * 100)));
    const [currentDigit, setCurrentDigit] = useState(Math.floor(Math.random() * 10));

    useEffect(() => {
        const interval = setInterval(() => {
            const nextDigit = Math.floor(Math.random() * 10);
            setCurrentDigit(nextDigit);
            setStats(prev => {
                const next = [...prev];
                next[nextDigit] += 1;
                // Normalize to keep them within reasonable visual bounds
                const total = next.reduce((a, b) => a + b, 0);
                return next.map(v => Math.round((v / total) * 100));
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const max = Math.max(...stats);
    const min = Math.min(...stats);

    return (
        <div className='dcircles-container'>
            <div className='stats-grid'>
                {stats.map((percentage, digit) => {
                    let colorClass = '';
                    if (percentage === max) colorClass = 'max';
                    else if (percentage === min) colorClass = 'min';

                    return (
                        <div key={digit} className={`digit-card ${currentDigit === digit ? 'active' : ''}`}>
                            <div className='digit-label'>{digit}</div>
                            <div className='bar-wrapper'>
                                <div 
                                    className={`bar ${colorClass}`} 
                                    style={{ height: `${percentage}%` }}
                                />
                            </div>
                            <div className='percentage'>{percentage}%</div>
                        </div>
                    );
                })}
            </div>
            <div className='current-display'>
                Last Digit: <span className='highlight'>{currentDigit}</span>
            </div>
        </div>
    );
};

export default Dcircles;
