import { action, makeObservable, observable } from 'mobx';
import RootStore from './root-store';

type IOnConfirmProps = {
    is_local: boolean;
    save_as_collection: boolean;
    bot_name: string;
};

interface ISaveModalStore {
    is_save_modal_open: boolean;
    button_status: { [key: string]: string } | number;
    bot_name: { [key: string]: string } | string;
    toggleSaveModal: () => void;
    validateBotName: (values: string) => { [key: string]: string };
    onConfirmSave: ({ is_local, save_as_collection, bot_name }: IOnConfirmProps) => void;
    updateBotName: (bot_name: string) => void;
    setButtonStatus: (status: { [key: string]: string } | string | number) => void;
}

export default class SaveModalStore implements ISaveModalStore {
    root_store: RootStore;

    constructor(root_store: RootStore) {
        makeObservable(this, {
            is_save_modal_open: observable,
            button_status: observable,
            bot_name: observable,
            toggleSaveModal: action.bound,
            validateBotName: action.bound,
            onConfirmSave: action.bound,
            updateBotName: action.bound,
            onDriveConnect: action.bound,
            setButtonStatus: action.bound,
        });

        this.root_store = root_store;
    }
    is_save_modal_open = false;
    button_status = 0;
    bot_name = '';

    toggleSaveModal = (): void => {
        // Save functionality is disabled.
        this.is_save_modal_open = false;
    };

    validateBotName = (): { [key: string]: string } => {
        // Save functionality is disabled.
        return {};
    };

    onConfirmSave = () => {
        // Save functionality is disabled.
    };

    updateBotName = (): void => {
        // Save functionality is disabled.
    };

    onDriveConnect = () => {
        // Save functionality is disabled.
    };

    setButtonStatus = () => {
        // Save functionality is disabled.
    };
}
