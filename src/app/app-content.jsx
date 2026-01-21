import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { ToastContainer } from 'react-toastify';
import AuthLoadingWrapper from '@/components/auth-loading-wrapper';
import useLiveChat from '@/components/chat/useLiveChat';
import ChunkLoader from '@/components/loader/chunk-loader';
import PWAInstallModal from '@/components/pwa-install-modal';
import { getUrlBase } from '@/components/shared';
import TncStatusUpdateModal from '@/components/tnc-status-update-modal';
import TransactionDetailsModal from '@/components/transaction-details';
import { TickDataProvider } from '@/contexts/TickDataContext';
import { api_base, ApiHelpers, ServerTime } from '@/external/bot-skeleton';
import { V2GetActiveToken } from '@/external/bot-skeleton/services/api/appId';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useApiBase } from '@/hooks/useApiBase';
import useIntercom from '@/hooks/useIntercom';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { useStore } from '@/hooks/useStore';
import useThemeSwitcher from '@/hooks/useThemeSwitcher';
import useTrackjs from '@/hooks/useTrackjs';
import initDatadog from '@/utils/datadog';
import initHotjar from '@/utils/hotjar';
import { setSmartChartsPublicPath } from '@deriv/deriv-charts';
import { ThemeProvider } from '@deriv-com/quill-ui';
import { localize } from '@deriv-com/translations';
import Audio from '../components/audio';
import BlocklyLoading from '../components/blockly-loading';
import BotStopped from '../components/bot-stopped';
import BotBuilder from '../pages/bot-builder';
import Main from '../pages/main';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import '../components/bot-notification/bot-notification.scss';

const AppContent = observer(() => {
    const [is_api_initialized, setIsApiInitialized] = React.useState(false);
    const [is_loading, setIsLoading] = React.useState(true);
    const [offline_timeout, setOfflineTimeout] = React.useState(null);
    const store = useStore();
    const { app, transactions, common, client } = store;
    const { showDigitalOptionsMaltainvestError } = app;
    const { is_dark_mode_on } = useThemeSwitcher();
    const { isOnline } = useOfflineDetection();

    const { recovered_transactions, recoverPendingContracts } = transactions;
    const is_subscribed_to_msg_listener = React.useRef(false);
    const msg_listener = React.useRef(null);
    const { connectionStatus } = useApiBase();
    const { initTrackJS } = useTrackjs();

    initTrackJS(client.loginid);

    const livechat_client_information = {
        is_client_store_initialized: client?.is_logged_in ? !!client?.account_settings?.email : !!client,
        is_logged_in: client?.is_logged_in,
        loginid: client?.loginid,
        landing_company_shortcode: client?.landing_company_shortcode,
        currency: client?.currency,
        residence: client?.residence,
        email: client?.account_settings?.email,
        first_name: client?.account_settings?.first_name,
        last_name: client?.account_settings?.last_name,
    };

    useLiveChat(livechat_client_information);

    const token = V2GetActiveToken() ?? null;
    useIntercom(token);

    useEffect(() => {
        console.log('[AppContent] Connection status changed:', connectionStatus);
        if (connectionStatus === CONNECTION_STATUS.OPENED) {
            setIsApiInitialized(true);
            common.setSocketOpened(true);
            if (offline_timeout) {
                clearTimeout(offline_timeout);
                setOfflineTimeout(null);
            }
        } else if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            common.setSocketOpened(false);
        }
    }, [common, connectionStatus, offline_timeout]);

    useEffect(() => {
        if (!isOnline && is_loading) {
            console.log('[AppContent] Offline detected, setting timeout.');
            const timeout = setTimeout(() => {
                console.log('[AppContent] Offline timeout reached.');
                setIsLoading(false);
                setIsApiInitialized(true);
                if (!app.dbot_store) {
                    init();
                }
            }, 3000);
            setOfflineTimeout(timeout);
        } else if (isOnline && offline_timeout) {
            clearTimeout(offline_timeout);
            setOfflineTimeout(null);
        }

        return () => {
            if (offline_timeout) {
                clearTimeout(offline_timeout);
            }
        };
    }, [isOnline, is_loading, offline_timeout, app.dbot_store]);

    const { current_language } = common;
    const html = document.documentElement;
    React.useEffect(() => {
        html?.setAttribute('lang', current_language.toLowerCase());
        html?.setAttribute('dir', current_language.toLowerCase() === 'ar' ? 'rtl' : 'ltr');
    }, [current_language, html]);

    const handleMessage = React.useCallback(
        ({ data }) => {
            if (data?.msg_type === 'proposal_open_contract' && !data?.error) {
                const { proposal_open_contract } = data;
                if (
                    proposal_open_contract?.status !== 'open' &&
                    !recovered_transactions?.includes(proposal_open_contract?.contract_id)
                ) {
                    recoverPendingContracts(proposal_open_contract);
                }
            }
        },
        [recovered_transactions, recoverPendingContracts]
    );

    React.useEffect(() => {
        setSmartChartsPublicPath(getUrlBase('/js/smartcharts/'));
    }, []);

    React.useEffect(() => {
        if (!is_subscribed_to_msg_listener.current && client.is_logged_in && is_api_initialized && api_base?.api) {
            console.log('[AppContent] Subscribing to message listener.');
            is_subscribed_to_msg_listener.current = true;
            msg_listener.current = api_base.api.onMessage()?.subscribe(handleMessage);
        }
        return () => {
            if (is_subscribed_to_msg_listener.current && msg_listener.current) {
                console.log('[AppContent] Unsubscribing from message listener.');
                is_subscribed_to_msg_listener.current = false;
                msg_listener.current.unsubscribe?.();
            }
        };
    }, [is_api_initialized, client.is_logged_in, client.loginid, handleMessage, connectionStatus]);

    React.useEffect(() => {
        showDigitalOptionsMaltainvestError(client, common);
    }, [client.is_options_blocked, client.account_settings?.country_code, client.clients_country]);

    const init = () => {
        console.log('[AppContent] Initializing stores.');
        ServerTime.init(common);
        app.setDBotEngineStores();
        ApiHelpers.setInstance(app.api_helpers_store);
        import('@/utils/gtm').then(({ default: GTM }) => {
            GTM.init(store);
        });
    };

    const changeActiveSymbolLoadingState = () => {
        console.log('[AppContent] Initializing and retrieving active symbols.');
        init();
        const retrieveActiveSymbols = () => {
            const { active_symbols } = ApiHelpers.instance;
            if (!isOnline) {
                console.log('[AppContent] Offline, skipping active symbols retrieval.');
                setIsLoading(false);
                return;
            }
            active_symbols
                .retrieveActiveSymbols(true)
                .then(() => {
                    console.log('[AppContent] Active symbols retrieved.');
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('[AppContent] Failed to retrieve active symbols:', error);
                    setIsLoading(false);
                });
        };

        if (ApiHelpers?.instance?.active_symbols) {
            retrieveActiveSymbols();
        } else {
            const intervalId = setInterval(() => {
                if (ApiHelpers?.instance?.active_symbols) {
                    clearInterval(intervalId);
                    retrieveActiveSymbols();
                } else if (!isOnline) {
                    clearInterval(intervalId);
                    setIsLoading(false);
                }
            }, 1000);
            setTimeout(() => {
                clearInterval(intervalId);
                if (is_loading) {
                    console.log('[AppContent] Active symbols retrieval timed out.');
                    setIsLoading(false);
                }
            }, 10000);
        }
    };

    React.useEffect(() => {
        if (is_api_initialized) {
            console.log('[AppContent] API initialized, starting loading sequence.');
            init();
            setIsLoading(true);
            if (!client.is_logged_in) {
                changeActiveSymbolLoadingState();
            }
        }
    }, [is_api_initialized]);

    React.useEffect(() => {
        if (client.is_logged_in && client.is_landing_company_loaded && is_api_initialized) {
            changeActiveSymbolLoadingState();
        }
    }, [client.is_landing_company_loaded, is_api_initialized, client.loginid]);

    useEffect(() => {
        initDatadog(true);
        if (client) {
            initHotjar(client);
        }
    }, []);

    if (common?.error) {
        console.error('[AppContent] Common error:', common.error);
        return null;
    }

    console.log(`[AppContent] Rendering: is_loading=${is_loading}, isOnline=${isOnline}`);

    const content = (
        <AuthLoadingWrapper>
            <ThemeProvider theme={is_dark_mode_on ? 'dark' : 'light'}>
                <TickDataProvider>
                    <BlocklyLoading />
                    <div className='bot-dashboard bot' data-testid='dt_bot_dashboard'>
                        <Audio />
                        <Main />
                        <BotBuilder />
                        <BotStopped />
                        <TransactionDetailsModal />
                        <PWAInstallModal />
                        <ToastContainer limit={3} draggable={false} />
                        <TncStatusUpdateModal />
                    </div>
                </TickDataProvider>
            </ThemeProvider>
        </AuthLoadingWrapper>
    );

    if (is_loading) {
        let message = 'Initializing Deriv Bot account...';
        if (!isOnline) {
            message = 'Loading offline dashboard...';
        }
        return <ChunkLoader message={localize(message)} />;
    }

    return content;
});

export default AppContent;
