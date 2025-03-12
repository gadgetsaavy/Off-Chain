const Web3 = require('web3');

const utils = {
    toWei: (value, unit = 'ether') => {
        return Web3.utils.toWei(value.toString(), unit);
    },

    fromWei: (value, unit = 'ether') => {
        return Web3.utils.fromWei(value.toString(), unit);
    },

    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    formatTimestamp: (timestamp) => {
        const date = new Date(timestamp);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
};

module.exports = utils;