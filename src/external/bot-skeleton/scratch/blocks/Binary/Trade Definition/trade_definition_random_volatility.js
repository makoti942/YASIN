import { localize } from '@deriv-com/translations';

window.Blockly.Blocks.trade_definition_random_volatility = {
    init() {
        this.jsonInit(this.definition());
    },
    definition() {
        return {
            message0: localize('Change Volatility on Each Trade: %1'),
            args0: [
                {
                    type: 'field_checkbox',
                    name: 'RANDOM_VOLATILITY',
                    checked: false,
                },
            ],
            previousStatement: 'trade_definition_market',
            nextStatement: 'trade_definition_market',
            colour: window.Blockly.Colours.RootBlock.colour,
            colourSecondary: window.Blockly.Colours.RootBlock.colourSecondary,
            colourTertiary: window.Blockly.Colours.RootBlock.colourTertiary,
            tooltip: localize('If you enable this, the bot will randomly pick a new volatility to trade on after each contract.'),
            category: window.Blockly.Categories.Trade_Definition,
        };
    },
    meta() {
        return {
            display_name: localize('Change Volatility on Each Trade'),
            description: localize('Enable this to randomly change the volatility after each trade.'),
        };
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.trade_definition_random_volatility = () => '';
