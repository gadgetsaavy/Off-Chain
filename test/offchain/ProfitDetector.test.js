const { expect } = require('chai');
const sinon = require('sinon');
const ProfitDetector = require('../src/offchain/ProfitDetector');
const Web3 = require('web3');

describe('ProfitDetector', () => {
    let profitDetector;
    let web3Mock;
    let routerMock;

    beforeEach(() => {
        web3Mock = new Web3('http://localhost:8545');
        routerMock = {
            methods: {
                getAmountsOut: sinon.stub().returns({
                    call: sinon.stub().resolves([1, 2])
                })
            }
        };

        profitDetector = new ProfitDetector({
            web3: web3Mock,
            routers: [routerMock],
            thresholds: { '0xTokenAddress': 1 }
        });
    });

    it('should detect opportunities', async () => {
        const tokens = ['0xTokenAddress'];
        const opportunities = await profitDetector.detectOpportunities(tokens);

        expect(opportunities).to.be.an('array').that.is.not.empty;
        expect(opportunities).to.have.property('token', '0xTokenAddress');
        expect(opportunities).to.have.property('price', 2);
        expect(opportunities).to.have.property('router', routerMock);
    });

    it('should fetch prices', async () => {
        const tokens = ['0xTokenAddress'];
        const prices = await profitDetector.fetchPrices(tokens);

        expect(prices).to.be.an('array').that.is.not.empty;
        expect(prices).to.have.property('token', '0xTokenAddress');
        expect(prices).to.have.property('value', 2);
        expect(prices).to.have.property('router', routerMock);
    });

    it('should calculate opportunities', () => {
        const prices = [
            { token: '0xTokenAddress', value: 2, router: routerMock }
        ];
        const opportunities = profitDetector.calculateOpportunities(prices);

        expect(opportunities).to.be.an('array').that.is.not.empty;
        expect(opportunities).to.have.property('token', '0xTokenAddress');
        expect(opportunities).to.have.property('price', 2);
        expect(opportunities).to.have.property('router', routerMock);
    });

    it('should filter opportunities', () => {
        const opportunities = [
            { token: '0xTokenAddress', price: 2, router: routerMock }
        ];
        const filtered = profitDetector.filterOpportunities(opportunities);

        expect(filtered).to.be.an('array').that.is.not.empty;
        expect(filtered).to.have.property('token', '0xTokenAddress');
        expect(filtered).to.have.property('price', 2);
        expect(filtered).to.have.property('router', routerMock);
    });
});