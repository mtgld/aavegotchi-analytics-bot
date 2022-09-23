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
    const query = `
    {
      channelAlchemicaEvents(where: {
        timestamp_gte: ${startTimestamp}
        timestamp_lt: ${endTimestamp}
        gotchiId_in:[${gotchis.join(",")}]
      }) {
        gotchiId
        alchemica
      }
    }`;

    let result = await apolloFetch({ query });
    return result.data.channelAlchemicaEvents;
};

const getParcelsOf = async (address) => {
    let query = `
    {parcels(where: {owner: "${address}"}) {
      id
    }}
    `;

    const result = await apolloFetch({ query });
    return result.data.parcels.map((e) => parseInt(e.id));
};

const getAlchemicaClaimedEventsOfParcels = async (
    parcels = [],
    startTimestamp = 0,
    endTimestamp = 0
) => {
    const query = `
{
  alchemicaClaimedEvents(where: {
    timestamp_gte: ${startTimestamp}
    timestamp_lt: ${endTimestamp}
    realmId_in:[${parcels.join(",")}]
  }) {
    realmId
    alchemicaType
    amount
    timestamp
  }
}`;

    let result = await apolloFetch({ query });
    return result.data.alchemicaClaimedEvents;
};

module.exports = {
    getChanneledAlchemicaEvents,
    getParcelsOf,
    getAlchemicaClaimedEventsOfParcels,
};
