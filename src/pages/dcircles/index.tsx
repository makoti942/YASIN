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

const HISTORY_COUNT = 100;

const Dcircles = () => {
    const [volatility, setVolatility] = useState('1HZ10V');
    const [digits, setDigits] = useState<number[]>([]);
    const [currentDigit, setCurrentDigit] = useState<number | null>(null);

    const ws = useRef<WebSocket | null>(null);
    const subscriptionId = useRef<string | null>(null);
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
        setDigits([]);
        subscriptionId.current = null;
        pipSize.current = null;

        ws.current = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=101585');
        const websocket = ws.current;

        websocket.onopen = () => {
            websocket.send(JSON.stringify({ ticks_history: volatility, end: 'latest', count: HISTORY_COUNT, style: 'ticks', subscribe: 1 }));
        };

        const onMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error('WebSocket error:', data.error.message);
                return;
            }

            if (data.subscription) {
                subscriptionId.current = data.subscription.id;
            }

            if (pipSize.current === null) {
                const firstPrice = data.history ? data.history.prices[0] : data.tick.quote;
                if (firstPrice.includes('.')) {
                    pipSize.current = firstPrice.split('.')[1].length;
                } else {
                    pipSize.current = 0;
                }
            }

            if (data.msg_type === 'history') {
                const history_digits = data.history.prices.map((p: string) => {
                    const quote = parseFloat(p).toFixed(pipSize.current!);
                    return parseInt(quote.slice(-1), 10);
                });
                setDigits(history_digits);
            }

            if (data.msg_type === 'tick') {
                const quote = parseFloat(data.tick.quote).toFixed(pipSize.current!);
                const new_digit = parseInt(quote.slice(-1), 10);
                setCurrentDigit(new_digit);
                setDigits(prev_digits => [...prev_digits.slice(1), new_digit]);
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

    const stats = React.useMemo(() => {
        const counts = Array(10).fill(0);
        digits.forEach(d => {
            if (d >= 0 && d <= 9) {
                counts[d]++;
            }
        });
        return counts.map(c => (c / digits.length) * 100);
    }, [digits]);

    const areAllStatsSame = stats.every(val => isNaN(val) || Math.abs(val - stats[0]) < 0.001);
    const maxVal = areAllStatsSame ? -1 : Math.max(...stats);
    const minVal = areAllStatsSame ? -1 : Math.min(...stats);

    const renderDigit = (digit: number) => {
        const percentage = stats[digit] || 0;
        const isMax = !areAllStatsSame && Math.abs(percentage - maxVal) < 0.001;
        const isMin = !areAllStatsSame && Math.abs(percentage - minVal) < 0.001;
        const colorClass = isMax ? 'is-most' : isMin ? 'is-least' : '';

        return (
            <div key={digit} className='digit-unit'>
                <div className={`arrow-indicator ${currentDigit === digit ? 'active' : ''}`}>{currentDigit === digit ? '▼' : ''}</div>
                <div className={`circle-shape ${colorClass} ${currentDigit === digit ? 'hitting' : ''}`}>
                    {digit}
                </div>
                <div className={`percent-label ${colorClass}`}>{percentage.toFixed(1)}%</div>
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
                    {[0, 1, 2, 3, 4].map(renderDigit)}
                </div>
                <div className='circles-row'>
                    {[5, 6, 7, 8, 9].map(renderDigit)}
                </div>
            </div>
        </div>
    );
};

export default Dcircles;
