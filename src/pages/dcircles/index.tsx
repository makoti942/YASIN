import React, { useEffect, useState, useRef } from 'react';
import './dcircles.scss';

const volatilities = [
    { id: 'R_10', name: 'Volatility 10 Index' },
    { id: 'R_25', name: 'Volatility 25 Index' },
    { id: 'R_50', name: 'Volatility 50 Index' },
    { id: 'R_75', name: 'Volatility 75 Index' },
    { id: 'R_100', name: 'Volatility 100 Index' },
    { id: '1HZ10V', name: 'Volatility 10 (1s) Index' },
    { id: '1HZ25V', name: 'Volatility 25 (1s) Index' },
    { id: '1HZ50V', name: 'Volatility 50 (1s) Index' },
    { id: '1HZ75V', name: 'Volatility 75 (1s) Index' },
    { id: '1HZ100V', name: 'Volatility 100 (1s) Index' },
    { id: '1HZ150V', name: 'Volatility 150 (1s) Index' },
    { id: '1HZ200V', name: 'Volatility 200 (1s) Index' },
    { id: '1HZ250V', name: 'Volatility 250 (1s) Index' },
    { id: '1HZ300V', name: 'Volatility 300 (1s) Index' },
];

const Dcircles = () => {
    const [volatility, setVolatility] = useState('1HZ10V');
    const [digitsBuffer, setDigitsBuffer] = useState<number[]>([]);
    const [currentDigit, setCurrentDigit] = useState<number | null>(null);
    const [stats, setStats] = useState(Array(10).fill(0));

    const ws = useRef<WebSocket | null>(null);
    const subscriptionId = useRef<string | null>(null);
    const targetStats = useRef(Array(10).fill(0));
    const animationFrameId = useRef<number | null>(null);
    const pipSize = useRef<number | null>(null);

    useEffect(() => {
        const savedVolatility = localStorage.getItem('selectedVolatility');
        if (savedVolatility) {
            setVolatility(savedVolatility);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedVolatility', volatility);

        if (ws.current) {
            ws.current.close();
        }
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }

        setCurrentDigit(null);
        setDigitsBuffer([]);
        setStats(Array(10).fill(0));
        targetStats.current = Array(10).fill(0);
        subscriptionId.current = null;

        ws.current = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=101585');
        const websocket = ws.current;

        websocket.onopen = () => {
            websocket.send(JSON.stringify({ active_symbols: 'brief', product_type: 'basic' }));
        };

        const onMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error('WebSocket error:', data.error.message);
                return;
            }

            if (data.msg_type === 'active_symbols') {
                const symbol = data.active_symbols.find((s: any) => s.symbol === volatility);
                if (symbol) {
                    pipSize.current = -Math.log10(symbol.pip);
                    websocket.send(JSON.stringify({ ticks_history: volatility, end: 'latest', count: 50, style: 'ticks' }));
                }
            }

            if (data.msg_type === 'history') {
                if (data.history && data.history.prices && typeof pipSize.current === 'number') {
                    const initialDigits = data.history.prices.map((price: string) => {
                        const quote = parseFloat(price);
                        const multiplier = Math.pow(10, pipSize.current!);
                        const lastDigit = Math.floor((quote * multiplier) % 10);
                        return lastDigit;
                    });
                    setDigitsBuffer(initialDigits);
                }
                websocket.send(JSON.stringify({ ticks: volatility, subscribe: 1 }));
            }

            if (data.msg_type === 'tick') {
                if (data.subscription) {
                    subscriptionId.current = data.subscription.id;
                }

                if (data.tick && typeof pipSize.current === 'number') {
                    const quote = data.tick.quote;
                    const multiplier = Math.pow(10, pipSize.current);
                    const lastDigit = Math.floor((quote * multiplier) % 10);

                    setCurrentDigit(lastDigit);
                    setDigitsBuffer(prev => {
                        const newBuffer = [...prev, lastDigit];
                        return newBuffer.length > 50 ? newBuffer.slice(-50) : newBuffer;
                    });
                }
            }
        };

        websocket.addEventListener('message', onMessage);

        return () => {
            if (websocket) {
                if (subscriptionId.current) {
                    websocket.send(JSON.stringify({ forget: subscriptionId.current }));
                }
                websocket.removeEventListener('message', onMessage);
                websocket.close();
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [volatility]);

    useEffect(() => {
        const counts = Array(10).fill(0);
        digitsBuffer.forEach(d => counts[d]++);
        const total = digitsBuffer.length;
        targetStats.current = total === 0 ? Array(10).fill(0) : counts.map(c => (c / total) * 100);
    }, [digitsBuffer]);

    useEffect(() => {
        const animateStats = () => {
            setStats(prevStats => {
                const newStats = prevStats.map((val, i) => {
                    const target = targetStats.current[i];
                    const diff = target - val;
                    return val + diff * 0.1; // Smooth transition
                });
                return newStats;
            });
            animationFrameId.current = requestAnimationFrame(animateStats);
        };

        animationFrameId.current = requestAnimationFrame(animateStats);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    const areAllStatsSame = stats.every(val => val.toFixed(2) === stats[0].toFixed(2));
    const maxVal = areAllStatsSame ? -1 : Math.max(...stats);
    const minVal = areAllStatsSame ? -1 : Math.min(...stats);

    return (
        <div className='dcircles-container'>
            <div className='vol-selector-wrapper'>
                <select className='deriv-dropdown' value={volatility} onChange={e => setVolatility(e.target.value)}>
                    {volatilities.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className='circles-layout'>
                {stats.map((percentage, digit) => {
                    const isMax = !areAllStatsSame && percentage === maxVal;
                    const isMin = !areAllStatsSame && percentage === minVal;
                    const colorClass = isMax ? 'is-most' : isMin ? 'is-least' : '';

                    return (
                        <div key={digit} className='digit-unit'>
                            <div className={`arrow-indicator ${currentDigit === digit ? 'active' : ''}`}>🔽</div>
                            <div className={`circle-shape ${colorClass} ${currentDigit === digit ? 'hitting' : ''}`}>
                                {digit}
                            </div>
                            <div className={`percent-label ${colorClass}`}>{percentage.toFixed(2)}%</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dcircles;
