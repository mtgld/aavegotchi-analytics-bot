const { ethers } = require("ethers");

const sumAlchemica = (results) => {
    let alchemicaSum = [0, 0, 0, 0];
    results.forEach((e) => {
        e.alchemica.forEach((a, i) => {
            alchemicaSum[i] =
                alchemicaSum[i] +
                parseFloat(ethers.utils.formatEther(a)) *
                    (1 - e.spilloverRate / 10000);
        });
    });
    return alchemicaSum;
};

const getUSDFromAlchemica = (
    alchemicaAmount = [0, 0, 0, 0],
    alchemicaPrices = [0, 0, 0, 0]
) => {
    return alchemicaAmount.reduce((prev, next, i) => {
        if (i == 1) {
            prev *= alchemicaPrices[0];
        }

        return prev + next * alchemicaPrices[1];
    });
};

const avgSpilloverRate = (results) => {
    let spilloverRateSum = 0;
    results.forEach((e) => {
        spilloverRateSum += parseInt(e.spilloverRate) / 100;
    });

    return parseFloat((spilloverRateSum / results.length).toFixed(2));
};

module.exports = {
    sumAlchemica,
    getUSDFromAlchemica,
    avgSpilloverRate,
};
