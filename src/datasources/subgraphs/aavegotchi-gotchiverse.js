const { createApolloFetch } = require("apollo-fetch");

const uri =
    process.env.GOTCHIVERSE_SUBGRAPH ||
    "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic";
const apolloFetch = createApolloFetch({ uri });

const getChanneledAlchemicaEvents = async (
    gotchis = [],
    startTimestamp = 0,
    endTimestamp = 0
) => {
    let lastId = "0";
    let allResults = [];
    let result = {};
    while (true) {
        const query = `
    {
      channelAlchemicaEvents(first: 1000 orderBy: id orderDirection: asc where: {
        timestamp_gte: ${startTimestamp}
        timestamp_lt: ${endTimestamp}
        gotchiId_in:["${gotchis.join('","')}"]
        id_gt: "${lastId}"
        spilloverRate_gt: "0"
      }) {
        id
        gotchiId
        alchemica
        spilloverRate
      }
    }`;

        result = await apolloFetch({ query });
        if (
            result.data &&
            result.data.channelAlchemicaEvents &&
            result.data.channelAlchemicaEvents.length > 0
        ) {
            allResults = allResults.concat(result.data.channelAlchemicaEvents);
            lastId =
                result.data.channelAlchemicaEvents[
                    result.data.channelAlchemicaEvents.length - 1
                ].id;
        } else {
            break;
        }
    }

    return allResults;
};

const getParcelsOf = async (address) => {
    let lastId = "0";
    let result;
    let allResults = [];
    do {
        let query = `
          {parcels(first: 1000 orderBy: id orderDirection: asc where: {id_gt: "${lastId}" owner: "${address}"}) {
            id
          }}
        `;

        result = await apolloFetch({ query });
        allResults = allResults.concat(
            result.data.parcels.map((e) => parseInt(e.id))
        );
        lastId = result.data.parcels[result.data.parcels.length - 1].id;
    } while (result.data.parcels.length == 1000);
    return allResults;
};

const getAlchemicaClaimedEventsOfParcels = async (
    parcels = [],
    startTimestamp = 0,
    endTimestamp = 0
) => {
    let allResults = [];
    let lastId = "0";
    let result;
    while (true) {
        const query = `
        {
        alchemicaClaimedEvents(first: 1000 orderBy: id orderDirection: asc where: {
            timestamp_gte: ${startTimestamp}
            timestamp_lt: ${endTimestamp}
            realmId_in:["${parcels.join('","')}"]
            id_gt: "${lastId}"
            spilloverRate_gt: "0"
        }) {
            id
            realmId
            alchemicaType
            amount
            timestamp
            spilloverRate
        }
        }`;

        result = await apolloFetch({ query });

        if (
            result.data &&
            result.data.alchemicaClaimedEvents &&
            result.data.alchemicaClaimedEvents.length > 0
        ) {
            allResults = allResults.concat(result.data.alchemicaClaimedEvents);
            lastId =
                result.data.alchemicaClaimedEvents[
                    result.data.alchemicaClaimedEvents.length - 1
                ].id;
        } else {
            break;
        }
    }
    return allResults;
};

module.exports = {
    getChanneledAlchemicaEvents,
    getParcelsOf,
    getAlchemicaClaimedEventsOfParcels,
};
