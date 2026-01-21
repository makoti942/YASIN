
import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { api_base } from '@/external/bot-skeleton';
import Text from '@/components/shared_ui/text';
import { Button } from '@/components/shared_ui/button';
import Input from '@/components/shared_ui/input';
import { Select } from '@/components/shared_ui/select-native';

const OverUnderTrader = observer(() => {
    const { client } = useStore();
    const [volatility, setVolatility] = useState('R_100');
    const [stake, setStake] = useState(1.0);
    const [isBotRunning, setIsBotRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [currentLastDigit, setCurrentLastDigit] = useState<string | null>(null);
    const subscriptionRef = useRef<any>(null);

    const volatilities = [
        { label: 'Volatility 10 Index', value: 'R_10' },
        { label: 'Volatility 10 (1s) Index', value: '1HZ10V' },
        { label: 'Volatility 25 Index', value: 'R_25' },
        { label: 'Volatility 25 (1s) Index', value: '1HZ25V' },
        { label: 'Volatility 50 Index', value: 'R_50' },
        { label: 'Volatility 50 (1s) Index', value: '1HZ50V' },
        { label: 'Volatility 75 Index', value: 'R_75' },
        { label: 'Volatility 75 (1s) Index', value: '1HZ75V' },
        { label: 'Volatility 100 Index', value: 'R_100' },
        { label: 'Volatility 100 (1s) Index', value: '1HZ100V' },
    ];

    useEffect(() => {
        if (isBotRunning) {
            subscribeToTicks();
        } else {
            unsubscribeFromTicks();
        }
        return () => {
            unsubscribeFromTicks();
        };
    }, [isBotRunning]);

     useEffect(() => {
        if (isBotRunning) {
            unsubscribeFromTicks();
            subscribeToTicks();
        }
    }, [volatility]);


    const log = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prevLogs => [`[${timestamp}] ${message}`, ...prevLogs]);
    };

    const subscribeToTicks = async () => {
        if (!client.is_logged_in) {
            log('Please log in to use the bot.');
            setIsBotRunning(false);
            return;
        }

        if (!api_base.api) {
            log('API is not ready. Please wait.');
            setIsBotRunning(false);
            return;
        }

        try {
            log(`Subscribing to ${volatility}...`);
            const subscription = api_base.api.subscribe({ ticks: volatility });
            subscriptionRef.current = subscription;

            (async () => {
                for await (const response of subscription) {
                    if (response.error) {
                        log(`Subscription error: ${response.error.message}`);
                        continue;
                    }
                    const tick = response.tick;
                    if (tick) {
                        const lastDigit = tick.quote.toString().slice(-1);
                        setCurrentLastDigit(lastDigit);
                        
                        if (isBotRunning && (lastDigit === '4' || lastDigit === '5')) {
                            log(`Entry condition met (last digit: ${lastDigit}). Placing trades...`);
                            await placeTrades();
                        }
                    }
                }
            })();

        } catch (e: any) {
            log(`Subscription failed: ${e?.error?.message || e?.message || 'Unknown error'}`);
            setIsBotRunning(false);
        }
    };

    const placeTrades = async () => {
        if (!api_base.api) {
            log('API not connected.');
            return;
        }
        log(`Placing trades with stake: ${stake}`);

        try {
            const common_params = {
                amount: stake,
                basis: 'stake',
                currency: 'USD',
                duration: 5,
                duration_unit: 't',
                symbol: volatility,
            };

            // Under 4
             const buy_under_promise = api_base.api.buy({
                price: stake,
                parameters: {
                    ...common_params,
                    contract_type: 'DIGITUNDER',
                    barrier: '4',
                },
            });

            // Over 5
            const buy_over_promise = api_base.api.buy({
                price: stake,
                parameters: {
                    ...common_params,
                    contract_type: 'DIGITOVER',
                    barrier: '5',
                },
            });

            const [buy_under, buy_over] = await Promise.all([buy_under_promise, buy_over_promise]);


            if (buy_under.error) {
                 log(`Error buying Under 4: ${buy_under.error.message}`);
            } else {
                 log(`Bought Under 4: ${buy_under.buy.contract_id}`);
            }

            if (buy_over.error) {
                 log(`Error buying Over 5: ${buy_over.error.message}`);
            } else {
                 log(`Bought Over 5: ${buy_over.buy.contract_id}`);
            }


        } catch (e: any) {
             log(`Error placing trade: ${e?.error?.message || e?.message || 'Unknown error'}`);
        }
    };

    const unsubscribeFromTicks = () => {
        if (subscriptionRef.current) {
            log('Unsubscribing from ticks...');
            try {
                subscriptionRef.current.unsubscribe();
            } catch (e) {
                // Ignore errors on unsubscribe
            }
            subscriptionRef.current = null;
        }
    };

    const toggleBot = () => {
        if(isBotRunning) {
            setCurrentLastDigit(null);
        }
        setIsBotRunning(!isBotRunning);
    };

    return (
        <div className="multi-trader-container">
            <div className="multi-trader-tab">
                <Text as="h1" weight="bold" size="xl" color="prominent">OVER UNDER TRADER</Text>
            </div>
             <div className="last-digit-display-container">
                <Text as="h3" weight="bold">Current Last Digit</Text>
                <div className="last-digit-display">
                    {currentLastDigit ?? '-'}
                </div>
            </div>
            <div className="multi-trader-content">
                 <div className="multi-trader-controls">
                     <div className="multi-trader-field">
                         <Text as="label" htmlFor="volatility-select" size="s">Select Volatility Index</Text>
                        <Select
                            id="volatility-select"
                            className="multi-trader-select"
                            options={volatilities}
                            value={volatility}
                            onChange={(e) => setVolatility(e.target.value)}
                        />
                     </div>
                      <div className="multi-trader-field">
                           <Text as="label" size="s">Stake (USD)</Text>
                           <Input
                            className="multi-trader-input"
                            type="number"
                            value={stake}
                            onChange={(e) => setStake(parseFloat(e.target.value))}
                            />
                      </div>

                    <Button
                        text={isBotRunning ? 'Stop Trading Bot' : 'Run Trading Bot'}
                        onClick={toggleBot}
                        primary
                        large
                    />
                </div>
                <div className="multi-trader-logs-container">
                    <Text as="h3" weight="bold">Logs</Text>
                    <div className="multi-trader-logs">
                        {logs.map((logMsg, i) => (
                            <div key={i} className="multi-trader-log-entry">{logMsg}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default OverUnderTrader;
