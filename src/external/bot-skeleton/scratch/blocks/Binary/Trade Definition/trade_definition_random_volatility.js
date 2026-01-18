import { localize } from '@deriv-com/translations';
import { runIrreversibleEvents } from '../../../utils';

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
    onchange: function (event) {
        if (!this.workspace || this.workspace.isDragging() || window.Blockly.derivWorkspace.isFlyoutVisible) {
            return;
        }

        if (event.type === window.Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)) {
            const trade_definition_block = this.workspace.getTradeDefinitionBlock();
            if (trade_definition_block && this.id !== trade_definition_block.id) {
                const random_volatility_block = trade_definition_block.getChildByType('trade_definition_random_volatility');
                if (random_volatility_block) {
                    runIrreversibleEvents(() => {
                        random_volatility_block.unplug(true);
                        random_volatility_block.dispose();
                    });
                }
            }
        }
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.trade_definition_random_volatility = () => '';
