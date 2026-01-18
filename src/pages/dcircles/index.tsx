import React, { useEffect, useRef,useState } from 'react';
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
    const lastTickTimestamp = useRef<number | null>(null);

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
        lastTickTimestamp.current = null;

        ws.current = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=101585');
        const websocket = ws.current;

        websocket.onopen = () => {
            websocket.send(
                JSON.stringify({
                    ticks_history: volatility,
                    end: 'latest',
                    count: HISTORY_COUNT,
                    style: 'ticks',
                    subscribe: 1,
                })
            );
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
                const firstPrice = data.history?.prices?.[0] ?? data.tick?.quote;
                if (firstPrice) {
                    const priceStr = String(firstPrice);
                    if (priceStr.includes('.')) {
                        pipSize.current = priceStr.split('.')[1].length;
                    } else {
                        pipSize.current = 0;
                    }
                }
            }

            if (data.msg_type === 'history' && data.history.prices) {
                const history_digits = data.history.prices
                    .map((p: string) => {
                        if (pipSize.current !== null) {
                            const quote = parseFloat(p).toFixed(pipSize.current);
                            return parseInt(quote.slice(-1), 10);
                        }
                        return null;
                    })
                    .filter((d): d is number => d !== null);
                setDigits(history_digits);
                if (data.history.times && data.history.times.length > 0) {
                    lastTickTimestamp.current = data.history.times[data.history.times.length - 1];
                }
            }

            if (data.msg_type === 'tick' && data.tick.quote) {
                if (lastTickTimestamp.current && data.tick.epoch <= lastTickTimestamp.current) {
                    return;
                }
                lastTickTimestamp.current = data.tick.epoch;

                if (pipSize.current !== null) {
                    const quote = parseFloat(data.tick.quote).toFixed(pipSize.current);
                    const new_digit = parseInt(quote.slice(-1), 10);
                    setCurrentDigit(new_digit);
                    setDigits(prev_digits => {
                        const new_digits = [...prev_digits, new_digit];
                        if (new_digits.length > HISTORY_COUNT) {
                            return new_digits.slice(new_digits.length - HISTORY_COUNT);
                        }
                        return new_digits;
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
        };
    }, [volatility]);

    const stats = React.useMemo(() => {
        const counts = Array(10).fill(0);
        if (digits.length === 0) {
            return counts.map(() => 0);
        }
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
                <div className={`arrow-indicator ${currentDigit === digit ? 'active' : ''}`}>
                    {currentDigit === digit ? '▼' : ''}
                </div>
                <div className={`circle-shape ${colorClass} ${currentDigit === digit ? 'hitting' : ''}`}>{digit}</div>
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
                <div className='circles-row'>{[0, 1, 2, 3, 4].map(renderDigit)}</div>
                <div className='circles-row'>{[5, 6, 7, 8, 9].map(renderDigit)}</div>
            </div>
        </div>
    );
};

export default Dcircles;
