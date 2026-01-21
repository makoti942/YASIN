
import React from 'react';
import Cookies from 'js-cookie';
import ChunkLoader from '@/components/loader/chunk-loader';
import { crypto_currencies_display_order, fiat_currencies_display_order } from '@/components/shared';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { clearAuthData } from '@/utils/auth-utils';
import { localize } from '@deriv-com/translations';
import { URLUtils } from '@deriv-com/utils';
import App from './App';

// Extend Window interface to include is_tmb_enabled property
declare global {
    interface Window {
        is_tmb_enabled?: boolean;
    }
}

const setLocalStorageToken = async (
    loginInfo: URLUtils.LoginInfo[],
    paramsToDelete: string[],
    isOnline: boolean
): Promise<boolean> => {
    if (loginInfo.length) {
        try {
            const defaultActiveAccount = URLUtils.getDefaultActiveAccount(loginInfo);
            if (!defaultActiveAccount) return false;

            const accountsList: Record<string, string> = {};
            const clientAccounts: Record<string, { loginid: string; token: string; currency: string }> = {};

            loginInfo.forEach((account: { loginid: string; token: string; currency: string }) => {
                accountsList[account.loginid] = account.token;
                clientAccounts[account.loginid] = account;
            });

            localStorage.setItem('accountsList', JSON.stringify(accountsList));
            localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));

            URLUtils.filterSearchParams(paramsToDelete);

            const url_params = new URLSearchParams(window.location.search);
            const account_currency_from_url = url_params.get('account');
            let activeToken = loginInfo[0].token;
            let activeLoginId = loginInfo[0].loginid;

            if (account_currency_from_url) {
                const upper_account_currency = account_currency_from_url.toUpperCase();
                const validCurrencies = [...fiat_currencies_display_order, ...crypto_currencies_display_order];
                const is_valid_currency = validCurrencies.includes(upper_account_currency);

                let target_account;

                if (upper_account_currency === 'DEMO') {
                    target_account = loginInfo.find(account => account.loginid.startsWith('VR'));
                } else if (is_valid_currency) {
                    target_account = loginInfo.find(
                        account =>
                            !account.loginid.startsWith('VR') && account.currency?.toUpperCase() === upper_account_currency
                    );
                }

                if (target_account) {
                    activeToken = target_account.token;
                    activeLoginId = target_account.loginid;
                }
            }
            
            localStorage.setItem('authToken', activeToken);
            localStorage.setItem('active_loginid', activeLoginId);

            if (!isOnline) {
                console.log('[Auth] Offline mode - skipping API connection');
                return true;
            }

            try {
                const api = await generateDerivApiInstance();

                if (api) {
                    const { authorize, error } = await api.authorize(activeToken);
                    api.disconnect();
                    if (error) {
                        console.error('[Auth] Authorization failed:', error);
                        clearAuthData();
                        const is_tmb_enabled = window.is_tmb_enabled === true;
                        if (Cookies.get('logged_state') === 'true' && !is_tmb_enabled) {
                            globalObserver.emit('InvalidToken', { error });
                        }
                        return true;
                    } else {
                        localStorage.setItem('client.country', authorize.country);
                        return true;
                    }
                }
            } catch (apiError) {
                console.error('[Auth] API connection error:', apiError);
            }
            return true;
        } catch (error) {
            console.error('Error setting up login info:', error);
            return false;
        }
    }
    return true;
};

export const AuthWrapper = () => {
    const [isAuthComplete, setIsAuthComplete] = React.useState(false);
    const { loginInfo, paramsToDelete } = URLUtils.getLoginInfoFromURL();
    const { isOnline } = useOfflineDetection();

    React.useEffect(() => {
        const initializeAuth = async () => {
            try {
                await setLocalStorageToken(loginInfo, paramsToDelete, isOnline);
                URLUtils.filterSearchParams(['lang']);
            } catch (error) {
                console.error('[Auth] Authentication initialization failed:', error);
            } finally {
                setIsAuthComplete(true);
            }
        };

        initializeAuth();
    }, [loginInfo, paramsToDelete, isOnline]);

    const getLoadingMessage = () => {
        if (!isOnline) return localize('Loading offline mode...');
        return localize('Initializing...');
    };

    if (!isAuthComplete) {
        return <ChunkLoader message={getLoadingMessage()} />;
    }

    return <App />;
};
