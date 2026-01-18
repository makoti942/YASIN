import { localize } from '@deriv-com/translations';
import { runIrreversibleEvents } from '../../../utils';

window.Blockly.Blocks.trade_definition_trade_on_every_tick = {
    init() {
        this.jsonInit(this.definition());
    },
    definition() {
        return {
            message0: localize('Trade on Every Tick: %1'),
            args0: [
                {
                    type: 'field_checkbox',
                    name: 'TRADE_ON_EVERY_TICK',
                    checked: false,
                },
            ],
            previousStatement: 'trade_definition_market',
            nextStatement: 'trade_definition_market',
            colour: window.Blockly.Colours.RootBlock.colour,
            colourSecondary: window.Blockly.Colours.RootBlock.colourSecondary,
            colourTertiary: window.Blockly.Colours.RootBlock.colourTertiary,
            tooltip: localize('If you enable this, the bot will trade on every single tick.'),
            category: window.Blockly.Categories.Trade_Definition,
        };
    },
    meta() {
        return {
            display_name: localize('Trade on Every Tick'),
            description: localize('Enable this to trade on every single tick.'),
        };
    },
    onchange: function (event) {
        if (!this.workspace || this.workspace.isDragging() || window.Blockly.derivWorkspace.isFlyoutVisible) {
            return;
        }

        if (event.type === window.Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)) {
            const trade_definition_block = this.workspace.getTradeDefinitionBlock();
            if (trade_definition_block && this.id !== trade_definition_block.id) {
                const trade_on_every_tick_block = trade_definition_block.getChildByType('trade_definition_trade_on_every_tick');
                if (trade_on_every_tick_block) {
                    runIrreversibleEvents(() => {
                        trade_on_every_tick_block.unplug(true);
                        trade_on_every_tick_block.dispose();
                    });
                }
            }
        }
    },
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.trade_definition_trade_on_every_tick = () => '';
