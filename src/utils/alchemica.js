const { ethers } = require("ethers");

const sumAlchemica = (results) => {
    let alchemica = [0, 0, 0, 0];
    results.forEach((e) => {
        alchemica.forEach((a, i) => {
            alchemica[i] =
                a + parseFloat(ethers.utils.formatEther(e.alchemica[i]));
        });
    });
    return alchemica;
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

module.exports = {
    sumAlchemica,
    getUSDFromAlchemica,
};
