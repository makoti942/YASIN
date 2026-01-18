import { localize } from '@deriv-com/translations';
import { modifyContextMenu } from '../../../utils';

window.Blockly.Blocks.trade_again = {
    init() {
        this.jsonInit(this.definition());

        // Ensure one of this type per statement-stack
        this.setNextStatement(false);
    },
    definition() {
        return {
            message0: localize('Trade again'),
            colour: window.Blockly.Colours.Special1.colour,
            colourSecondary: window.Blockly.Colours.Special1.colourSecondary,
            colourTertiary: window.Blockly.Colours.Special1.colourTertiary,
            previousStatement: null,
            tooltip: localize('These blocks transfer control to the Purchase conditions block.'),
            category: window.Blockly.Categories.After_Purchase,
        };
    },
    meta() {
        return {
            display_name: localize('Trade again'),
            description: localize(
                'This block will transfer the control back to the Purchase conditions block, enabling you to purchase another contract.'
            ),
            key_words: localize('restart'),
        };
    },
    customContextMenu(menu) {
        modifyContextMenu(menu);
    },
    restricted_parents: ['after_purchase'],
};

window.Blockly.JavaScript.javascriptGenerator.forBlock.trade_again = () => {
    const code = `
        if (Bot.shouldChangeVolatility) {
            const symbols = ['R_10', 'R_25', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'];
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            Bot.setSymbol(randomSymbol);
        }

        Bot.isTradeAgain(true);\n
        return true;\n
    `;

    return code;
};
