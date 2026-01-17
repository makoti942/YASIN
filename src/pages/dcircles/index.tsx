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
    const [digitsBuffer, setDigitsBuffer] = useState<number[]>([]);
    const [currentDigit, setCurrentDigit] = useState<number | null>(null);

    useEffect(() => {
        // Attempt to find the global websocket or use the one from Deriv API
        const ws = (window as any).ws || (window as any).derivWS || (window as any).DerivAPI?.api?.connection || (window as any).api_base?.api?.connection; 

        if (!ws || (ws.readyState !== 1 && ws.readyState !== 0)) {
            console.warn('Deriv WebSocket not found or closed, falling back to mock.');
            const interval = setInterval(() => {
                const nextDigit = Math.floor(Math.random() * 10);
                setCurrentDigit(nextDigit);
                setDigitsBuffer(prev => {
                    const next = [...prev, nextDigit];
                    if (next.length > 100) return next.slice(-100);
                    return next;
                });
            }, 1000);
            return () => clearInterval(interval);
        }

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.msg_type === 'tick' && data.tick.symbol === volatility) {
                const quote = data.tick.quote.toString();
                const lastDigit = parseInt(quote.slice(-1));
                
                setCurrentDigit(lastDigit);
                setDigitsBuffer(prev => {
                    const next = [...prev, lastDigit];
                    if (next.length > 100) return next.slice(-100);
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

    // Math logic: Map raw frequency in 100-tick window
    const stats = useMemo(() => {
        if (digitsBuffer.length === 0) return Array(10).fill(0);
        
        const counts = Array(10).fill(0);
        digitsBuffer.forEach(d => counts[d]++);
        
        return counts.map(count => parseFloat(((count / digitsBuffer.length) * 100).toFixed(2)));
    }, [digitsBuffer]);

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
                        setDigitsBuffer([]); // Reset stats
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
