import React, { useEffect, useState, useRef } from 'react';
import { Localize } from '@deriv-com/translations';
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
];

const DAMPING_FACTOR = 0.1;
const BASE_PERCENTAGE = 10;
const MAX_CHANGE = 0.02;

const Dcircles = () => {
    const [volatility, setVolatility] = useState('1HZ10V');
    const [digitsBuffer, setDigitsBuffer] = useState<number[]>([]);
    const [currentDigit, setCurrentDigit] = useState<number | null>(null);
    const [stats, setStats] = useState(Array(10).fill(BASE_PERCENTAGE));

    const ws = useRef<WebSocket | null>(null);
    const subscriptionId = useRef<string | null>(null);
    const targetStats = useRef(Array(10).fill(BASE_PERCENTAGE));
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

        setCurrentDigit(null);
        setDigitsBuffer([]);
        setStats(Array(10).fill(BASE_PERCENTAGE));
        targetStats.current = Array(10).fill(BASE_PERCENTAGE);
        subscriptionId.current = null;
        pipSize.current = null;

        ws.current = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=101585');
        const websocket = ws.current;

        websocket.onopen = () => {
            // We need pip_size first, so we subscribe to ticks
            websocket.send(JSON.stringify({ ticks: volatility, subscribe: 1 }));
        };

        const onMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error('WebSocket error:', data.error.message);
                return;
            }

            if (data.msg_type === 'tick') {
                if (data.subscription) {
                    subscriptionId.current = data.subscription.id;
                }

                if (data.tick) {
                    // First tick response will have pip_size
                    if (pipSize.current === null && data.tick.pip_size !== undefined) {
                        pipSize.current = data.tick.pip_size;
                        // Now that we have pip_size, get history
                        websocket.send(JSON.stringify({ ticks_history: volatility, end: 'latest', count: 50, style: 'ticks' }));
                    }

                    if (pipSize.current !== null) {
                        const quote = parseFloat(data.tick.quote).toFixed(pipSize.current);
                        const lastDigit = parseInt(quote.slice(-1), 10);

                        setCurrentDigit(lastDigit);
                        setDigitsBuffer(prev => {
                            const newBuffer = [...prev, lastDigit];
                            return newBuffer.length > 50 ? newBuffer.slice(-50) : newBuffer;
                        });
                    }
                }
            }

            if (data.msg_type === 'history') {
                if (data.history && data.history.prices && pipSize.current !== null) {
                    const initialDigits = data.history.prices.map((price: string) => {
                        const quote = parseFloat(price).toFixed(pipSize.current!);
                        return parseInt(quote.slice(-1), 10);
                    });
                    setDigitsBuffer(initialDigits);

                    // Initialize stats based on history
                    const counts = Array(10).fill(0);
                    initialDigits.forEach(d => counts[d]++);
                    const total = initialDigits.length;
                    const initialPercentages = total === 0 ? Array(10).fill(BASE_PERCENTAGE) : counts.map(c => BASE_PERCENTAGE + (c / total * 100 - BASE_PERCENTAGE) * DAMPING_FACTOR);
                    setStats(initialPercentages);
                    targetStats.current = initialPercentages;
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
        };
    }, [volatility]);

    useEffect(() => {
        if (digitsBuffer.length === 0) return;

        const counts = Array(10).fill(0);
        digitsBuffer.forEach(d => counts[d]++);
        const total = digitsBuffer.length;
        targetStats.current = total === 0 ? Array(10).fill(BASE_PERCENTAGE) : counts.map(c => BASE_PERCENTAGE + (c / total * 100 - BASE_PERCENTAGE) * DAMPING_FACTOR);
    }, [digitsBuffer]);

    useEffect(() => {
        const animateStats = () => {
            setStats(prevStats => {
                const newStats = prevStats.map((val, i) => {
                    const target = targetStats.current[i];
                    const diff = target - val;

                    if (Math.abs(diff) < 0.001) {
                        return target;
                    }

                    const change = diff > 0 ? Math.min(diff * 0.1, MAX_CHANGE) : Math.max(diff * 0.1, -MAX_CHANGE);
                    return val + change;
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

    const renderDigit = (digit: number, percentage: number) => {
        const isMax = !areAllStatsSame && percentage === maxVal;
        const isMin = !areAllStatsSame && percentage === minVal;
        const colorClass = isMax ? 'is-most' : isMin ? 'is-least' : '';

        return (
            <div key={digit} className='digit-unit'>
                <div className={`arrow-indicator ${currentDigit === digit ? 'active' : ''}`}>{currentDigit === digit ? '▼' : ''}</div>
                <div className={`circle-shape ${currentDigit === digit ? 'hitting' : ''}`}>
                    {digit}
                </div>
                <div className={`percent-label ${colorClass}`}>{percentage.toFixed(2)}%</div>
            </div>
        );
    };

    return (
        <div className='dcircles-container'>
            <div className='vol-selector-wrapper'>
                <select className='deriv-dropdown' value={volatility} onChange={e => setVolatility(e.target.value)}>
                    {volatilities.map(v => (
                        <option key={v.id} value={v.id}>
                            <Localize i18n_default_text={v.name} />
                        </option>
                    ))}
                </select>
            </div>

            <div className='circles-layout'>
                <div className='circles-row'>
                    {stats.slice(0, 6).map((percentage, digit) => renderDigit(digit, percentage))}
                </div>
                <div className='circles-row'>
                    {stats.slice(6, 10).map((percentage, index) => renderDigit(index + 6, percentage))}
                </div>
            </div>
        </div>
    );
};

export default Dcircles;
