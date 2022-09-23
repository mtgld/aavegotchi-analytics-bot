const { createApolloFetch } = require("apollo-fetch");

const apolloFetchCore = createApolloFetch({
    uri:
        process.env.CORE_SUBGRAPH ||
        "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic",
});

const fetchGotchiIdsOf = async (walletAddress) => {
    let query = `{aavegotchis(where: {originalOwner: "${walletAddress.toLowerCase()}"}) {
        id
    }}`;

    let result = await apolloFetchCore({ query });
    return result.data.aavegotchis.map((e) => parseInt(e.id));
};

module.exports = {
    fetchGotchiIdsOf,
};
