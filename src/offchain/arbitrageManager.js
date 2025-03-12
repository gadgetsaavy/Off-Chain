const ArbitrageExecutor = require('./ArbitrageExecutor');
const ProfitDetector = require('./profitDetector');
const FlashbotClient = require('./flashbotClient');

class ArbitrageManager {
    constructor(config) {
        this.executor = new ArbitrageExecutor(config);
        this.detector = new ProfitDetector(config);
        this.flashbotClient = new FlashbotClient(config);
    }

    async init() {
        await this.flashbotClient.init();
    }

    async findAndExecuteArbitrage(opportunity) {
        const profit = await this.detector.detectProfit(opportunity);
        if (profit > opportunity.minProfit) {
            const receipt = await this.executor.executeOpportunity(opportunity);
            return receipt;
        } else {
            console.log('No profitable arbitrage opportunity found.');
        }
    }
}

module.exports = ArbitrageManager;