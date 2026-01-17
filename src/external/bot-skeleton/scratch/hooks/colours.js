const lightMode = () => {
    const workspace = Blockly;
    workspace.Colours.RootBlock = {
        colour: '#064e72',
        colourSecondary: '#064e72',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Base = {
        colour: '#e5e5e5',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special1 = {
        colour: '#e5e5e5',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special2 = {
        colour: '#e5e5e5',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special3 = {
        colour: '#e5e5e5',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special4 = {
        colour: '#e5e5e5',
        colourSecondary: '#ffffff',
        colourTertiary: '#6d7278',
    };
};

const darkMode = () => {
    const workspace = Blockly;
    workspace.Colours.RootBlock = {
        colour: '#064e72',
        colourSecondary: '#064e72',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Base = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special1 = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special2 = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special3 = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Special4 = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Logic = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Loops = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Text = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Mathematical = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };

    workspace.Colours.Variables = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Functions = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.List = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Indicators = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Time = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Tick_Analysis = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Candle = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
    workspace.Colours.Miscellaneous = {
        colour: '#2e2e2e',
        colourSecondary: '#3c3c3c',
        colourTertiary: '#6d7278',
    };
};

export const setColors = isDarkMode => {
    if (isDarkMode) {
        darkMode();
    } else {
        lightMode();
    }
};
