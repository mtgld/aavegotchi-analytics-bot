const { ethers } = require("ethers");
const { fetchAlchemicaPrices } = require("../datasources/http/llama");
const {
    getAlchemicaClaimedEventsOfParcels,
} = require("../datasources/subgraphs/aavegotchi-gotchiverse");
const { getUSDFromAlchemica } = require("../utils/alchemica");
const {
    TIME_INTERVAL_24h,
    TIME_INTERVAL_7d,
    TIME_INTERVAL_30d,
} = require("../utils/constants");
const { getTimestampOfEndOfYesterday } = require("../utils/datetime");

// Calc Parcel Revenue
const claimedAlchemicaWithUSD = async (parcels = []) => {
    // get Parcels
    let endTimestamp = getTimestampOfEndOfYesterday();

    const alchemicaPrices = await fetchAlchemicaPrices();
    const results = await Promise.all([
        getAlchemicaClaimedEventsOfParcels(
            parcels,
            endTimestamp - TIME_INTERVAL_24h,
            endTimestamp
        ),
        getAlchemicaClaimedEventsOfParcels(
            parcels,
            endTimestamp - TIME_INTERVAL_7d,
            endTimestamp
        ),
        getAlchemicaClaimedEventsOfParcels(
            parcels,
            endTimestamp - TIME_INTERVAL_30d,
            endTimestamp
        ),
    ]);

    const sumAlchemica = (results) => {
        let alchemica = [0, 0, 0, 0];
        results.forEach((e) => {
            alchemica[parseInt(e.alchemicaType)] =
                alchemica[parseInt(e.alchemicaType)] +
                parseFloat(ethers.utils.formatEther(e.amount));
        });
        return alchemica;
    };

    let overallDataIntervals = [
        { alchemica: [0, 0, 0, 0], usd: 0, harvests: 0, parcels: 0 },
        { alchemica: [0, 0, 0, 0], usd: 0, harvests: 0, parcels: 0 },
        { alchemica: [0, 0, 0, 0], usd: 0, harvests: 0, parcels: 0 },
    ];
    let parcelDataIntervals = [];

    parcels.forEach((parcelId, index) => {
        // daily, weekly, monthly
        let parcelSums = [];
        results.forEach((r, i) => {
            let parcelResultsFilter = r.filter(
                (f) => parseInt(f.realmId) == parcelId
            );
            let alchemicaSums = sumAlchemica(parcelResultsFilter);
            const usdFromAlchemicaSums = getUSDFromAlchemica(
                alchemicaSums,
                alchemicaPrices
            );

            parcelSums.push({
                alchemica: alchemicaSums,
                usd: usdFromAlchemicaSums,
            });
            overallDataIntervals[i].alchemica[0] += alchemicaSums[0];
            overallDataIntervals[i].alchemica[1] += alchemicaSums[1];
            overallDataIntervals[i].alchemica[2] += alchemicaSums[2];
            overallDataIntervals[i].alchemica[3] += alchemicaSums[3];
            overallDataIntervals[i].harvests = r.length;
            overallDataIntervals[i].parcels = parcels.length;
            overallDataIntervals[i].usd += usdFromAlchemicaSums;
        });
        parcelDataIntervals.push(parcelSums);
    });

    return {
        overallDataIntervals: overallDataIntervals,
        parcelDataIntervals: parcelDataIntervals,
    };
};

module.exports = { claimedAlchemicaWithUSD };
