const fetch = require('node-fetch');

class FlashbotsClient {
    constructor(config) {
        this.url = config.url;
        this.privateKey = config.privateKey;
        this.provider = config.provider;
    }

    async submitBundle(signer, bundle) {
        const signedBundle = await this.signBundle(signer, bundle);
        const response = await fetch(this.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_sendBundle',
                params: [signedBundle],
                id: 1
            })
        });
        return response.json();
    }

    async signBundle(signer, bundle) {
        const chainId = await this.provider.getNetwork().chainId;
        const signed = await signer.signTransaction({
            to: bundle.to,
            data: bundle.data,
            gasPrice: bundle.gasPrice,
            maxFeePerGas: await this.calculateMaxFee(),
            maxPriorityFeePerGas: await this.calculatePriorityFee(),
            chainId: chainId,
            type: 2
        });
        return signed.rawTransaction;
    }

    async calculateMaxFee() {
        const baseFee = await this.provider.getFeeData();
        return baseFee.maxFeePerGas;
    }

    async calculatePriorityFee() {
        const baseFee = await this.provider.getFeeData();
        return baseFee.maxPriorityFeePerGas;
    }
}

module.exports = FlashbotsClient;