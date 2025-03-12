const { expect } = require('chai');
const sinon = require('sinon');
const fetch = require('node-fetch');
const FlashbotsClient = require('../src/offchain/FlashbotsClient');

describe('FlashbotsClient', () => {
    let flashbotsClient;
    let providerMock;
    let signerMock;
    let fetchStub;

    beforeEach(() => {
        providerMock = {
            getNetwork: sinon.stub().resolves({ chainId: 1 }),
            getFeeData: sinon.stub().resolves({
                maxFeePerGas: 100,
                maxPriorityFeePerGas: 2
            })
        };

        signerMock = {
            signTransaction: sinon.stub().resolves({
                rawTransaction: '0x1234567890abcdef'
            })
        };

        flashbotsClient = new FlashbotsClient({
            url: 'https://relay.flashbots.net',
            privateKey: '0x1234567890abcdef',
            provider: providerMock
        });

        fetchStub = sinon.stub(fetch, 'default');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should submit a bundle successfully', async () => {
        const bundle = {
            to: '0x1234567890abcdef',
            data: '0xabcdef',
            gasPrice: 100
        };

        fetchStub.resolves({
            json: sinon.stub().resolves({ result: '0xabcdef' })
        });

        const result = await flashbotsClient.submitBundle(signerMock, bundle);

        expect(result).to.deep.equal({ result: '0xabcdef' });
        expect(fetchStub.calledOnce).to.be.true;
        expect(signerMock.signTransaction.calledOnce).to.be.true;
    });

    it('should sign a bundle successfully', async () => {
        const bundle = {
            to: '0x1234567890abcdef',
            data: '0xabcdef',
            gasPrice: 100
        };

        const signedBundle = await flashbotsClient.signBundle(signerMock, bundle);

        expect(signedBundle).to.equal('0x1234567890abcdef');
        expect(signerMock.signTransaction.calledOnce).to.be.true;
    });

    it('should calculate max fee per gas', async () => {
        const maxFee = await flashbotsClient.calculateMaxFee();

        expect(maxFee).to.equal(100);
        expect(providerMock.getFeeData.calledOnce).to.be.true;
    });

    it('should calculate priority fee per gas', async () => {
        const priorityFee = await flashbotsClient.calculatePriorityFee();

        expect(priorityFee).to.equal(2);
        expect(providerMock.getFeeData.calledOnce).to.be.true;
    });
});