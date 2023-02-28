const { createApolloFetch } = require("apollo-fetch");

const apolloFetchCore = createApolloFetch({
    uri:
        process.env.CORE_SUBGRAPH ||
        "https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/aavegotchi-core-matic/api",
});

const fetchGotchiIdsOf = async (walletAddress) => {
    let allResults = [];
    let id = "0";
    let results = {};
    do {
        let query = `{aavegotchis(orderBy: id orderDirection: asc first: 1000 where: {id_gt: "${id}" originalOwner: "${walletAddress.toLowerCase()}"}) {
            id
        }}`;

        results = await apolloFetchCore({ query });
        allResults = allResults.concat(
            results.data.aavegotchis.map((e) => parseInt(e.id))
        );
        id = results.data.aavegotchis[results.data.aavegotchis.length - 1].id;
    } while (results.data && results.data.aavegotchis.length == 1000);

    return allResults;
};

module.exports = {
    fetchGotchiIdsOf,
};
