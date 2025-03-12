class ProfitDetector {
    constructor(config) {
        this.web3 = config.web3;
        this.routers = config.routers;
        this.thresholds = config.thresholds;
        this.cache = new Map();
    }

    async detectOpportunities(tokens) {
        const prices = await this.fetchPrices(tokens);
        const opportunities = this.calculateOpportunities(prices);
        return this.filterOpportunities(opportunities);
    }

    async fetchPrices(tokens) {
        const promises = tokens.map(token => 
            this.routers.map(router => 
                this.getPrice(token, router)
            )
        );
        return Promise.all(promises.flat());
    }

    async getPrice(token, router) {
        const price = await router.methods.getAmountsOut(1, [token, this.web3.utils.toWei('1', 'ether')]).call();
        return { token, value: price, router };
    }

    calculateOpportunities(prices) {
        return prices.map(price => ({
            token: price.token,
            price: price.value,
            router: price.router,
            timestamp: Date.now()
        }));
    }

    filterOpportunities(opportunities) {
        return opportunities.filter(opportunity => {
            const threshold = this.thresholds[opportunity.token];
            return opportunity.price >= threshold;
        });
    }
}

module.exports = ProfitDetector;