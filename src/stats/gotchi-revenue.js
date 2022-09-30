const { ethers } = require("ethers");
const { fetchAlchemicaPrices } = require("../datasources/http/llama");
const {
    getChanneledAlchemicaEvents,
} = require("../datasources/subgraphs/aavegotchi-gotchiverse");
const { sumAlchemica, getUSDFromAlchemica } = require("../utils/alchemica");
const {
    TIME_INTERVAL_24h,
    TIME_INTERVAL_7d,
    TIME_INTERVAL_30d,
} = require("../utils/constants");
const { getTimestampOfEndOfYesterday } = require("../utils/datetime");

const channeledAlchemicaWithUSD = async (gotchis = []) => {
    let endTimestamp = getTimestampOfEndOfYesterday();

    const alchemicaPrices = await fetchAlchemicaPrices();
    const results = await Promise.all([
        getChanneledAlchemicaEvents(
            gotchis.map((e) => parseInt(e)),
            endTimestamp - TIME_INTERVAL_24h,
            endTimestamp
        ),
        getChanneledAlchemicaEvents(
            gotchis,
            endTimestamp - +TIME_INTERVAL_7d,
            endTimestamp
        ),
        getChanneledAlchemicaEvents(
            gotchis,
            endTimestamp - TIME_INTERVAL_30d,
            endTimestamp
        ),
    ]);

    let overallDataIntervals = [
        { alchemica: [0, 0, 0, 0], usd: 0, channels: 0, gotchis: 0 },
        { alchemica: [0, 0, 0, 0], usd: 0, channels: 0, gotchis: 0 },
        { alchemica: [0, 0, 0, 0], usd: 0, channels: 0, gotchis: 0 },
    ];

    let gotchisDataIntervals = [];
    gotchis.forEach((gotchiId) => {
        let gotchiDataIntervals = [];
        results.forEach((r, i) => {
            let gotchiResultsInterval = r.filter((f) => f.gotchiId == gotchiId);
            const alchemicaSums = sumAlchemica(gotchiResultsInterval);
            const usdFromAlchemicaSums = getUSDFromAlchemica(
                alchemicaSums,
                alchemicaPrices
            );
            gotchiDataIntervals.push({
                alchemica: alchemicaSums,
                usd: usdFromAlchemicaSums,
            });
            overallDataIntervals[i].alchemica[0] += alchemicaSums[0];
            overallDataIntervals[i].alchemica[1] += alchemicaSums[1];
            overallDataIntervals[i].alchemica[2] += alchemicaSums[2];
            overallDataIntervals[i].alchemica[3] += alchemicaSums[3];
            overallDataIntervals[i].channels = r.length;
            overallDataIntervals[i].gotchis = gotchis.length;
            overallDataIntervals[i].usd += usdFromAlchemicaSums;
        });

        gotchisDataIntervals.push(gotchiDataIntervals);
    });

    return {
        overallDataIntervals: overallDataIntervals,
        gotchisDataIntervals: gotchisDataIntervals,
    };
};

module.exports = {
    channeledAlchemicaWithUSD,
};
