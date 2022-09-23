require("dotenv").config();
const Table = require("easy-table");

const GOTCHI_IDS = process.env.GOTCHI_IDS?.split(",") || [];
const OWNER_WALLET_ADDRESS =
    process.env.ORIGINAL_OWNER_WALLET_ADDRESS?.toLocaleLowerCase() ||
    "0x0000000000000000000000000000000000000000";

const { createApolloFetch } = require("apollo-fetch");
const { ethers } = require("ethers");

// Init Subgraph Client
const uri =
    process.env.GOTCHIVERSE_SUBGRAPH ||
    "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic";
const apolloFetch = createApolloFetch({ uri });
const apolloFetchCore = createApolloFetch({
    uri:
        process.env.CORE_SUBGRAPH ||
        "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic",
});

// Calc Channeled Alchemica Revenue
const TIME_INTERVAL_24h = 86400;
const TIME_INTERVAL_7d = 604800;
const TIME_INTERVAL_30d = 2592000;

const ALCHEMICA_FUD_ADDRESS = "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f";
const ALCHEMICA_FOMO_ADDRESS = "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8";
const ALCHEMICA_ALPHA_ADDRESS = "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2";
const ALCHEMICA_KEK_ADDRESS = "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C";
const REVENUE_TOKENS = [
    ALCHEMICA_FUD_ADDRESS,
    ALCHEMICA_FOMO_ADDRESS,
    ALCHEMICA_ALPHA_ADDRESS,
    ALCHEMICA_KEK_ADDRESS,
];
let alchemicaPrices = [0, 0, 0, 0];

const axios = require("axios");
const updateAlchemicaPrices = async () => {
    let promisses = [];
    let tokens = REVENUE_TOKENS.map((e) => `polygon:${e}`).join(",");
    const values = await axios.default.get(
        `https://coins.llama.fi/prices/current/${tokens}`
    );

    alchemicaPrices[0] =
        values.data.coins[`polygon:${ALCHEMICA_FUD_ADDRESS}`].price;
    alchemicaPrices[1] =
        values.data.coins[`polygon:${ALCHEMICA_FOMO_ADDRESS}`].price;
    alchemicaPrices[2] =
        values.data.coins[`polygon:${ALCHEMICA_ALPHA_ADDRESS}`].price;
    alchemicaPrices[3] =
        values.data.coins[`polygon:${ALCHEMICA_KEK_ADDRESS}`].price;
};

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

const fetchGotchiIds = async (walletAddress) => {
    let query = `{aavegotchis(where: {originalOwner: "${walletAddress.toLowerCase()}"}) {
        id
    }}`;

    let result = await apolloFetchCore({ query });
    return result.data.aavegotchis.map((e) => parseInt(e.id));
};

const getChanneledAlchemicaRevenue = async (gotchiIds = []) => {
    let currentTimestamp = parseInt((new Date().getTime() / 1000).toString());
    let gotchis = gotchiIds.length > 0 ? gotchiIds : GOTCHI_IDS;
    const results = await Promise.all([
        getChanneledAlchemicaEvents(
            gotchis.map((e) => parseInt(e)),
            currentTimestamp - TIME_INTERVAL_24h,
            currentTimestamp
        ),
        getChanneledAlchemicaEvents(
            gotchis,
            currentTimestamp - TIME_INTERVAL_7d,
            currentTimestamp
        ),
        getChanneledAlchemicaEvents(
            gotchis,
            currentTimestamp - TIME_INTERVAL_30d,
            currentTimestamp
        ),
    ]);

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

    let data = [];

    gotchis.forEach((gotchiId) => {
        // daily, weekly, monthly
        let gotchiSums = [];
        let channelEvents = 0;
        results.forEach((r, i) => {
            let gotchiResultsInterval = r.filter((f) => f.gotchiId == gotchiId);
            gotchiSums.push(sumAlchemica(gotchiResultsInterval));
        });

        let gotchiTable = formatChanneledAlchemicaMessage(gotchiId, gotchiSums);
        data.push({
            gotchiId: gotchiId,
            data: gotchiSums,
            gotchiAmount: gotchis.length,
            channelAmount: channelEvents,
            message: gotchiTable,
        });
    });

    return data;
};

const formatChanneledAlchemicaMessage = (gotchiId, data) => {
    const getInterval = (i) => {
        switch (i) {
            case 0:
                return "24h";
            case 1:
                return "7d";
            case 2:
                return "30d";
            default:
                return "Unknown";
        }
    };
    const t = new Table();

    data.forEach((e, i) => {
        t.cell("INTERVAL", getInterval(i));
        t.cell("FUD", e[0].toFixed(2));
        t.cell("FOMO", e[1].toFixed(2));
        t.cell("ALPHA", e[2].toFixed(2));
        t.cell("KEK", e[3].toFixed(2));
        t.newRow();
    });

    const message = `Gotchi ${gotchiId} channeled Alchemica\n${t.toString()}`;
    return message;
};

const formatAlchemicaClaimedParcelMessage = (parcelId, data, dataUSD) => {
    const getInterval = (i) => {
        switch (i) {
            case 0:
                return "24h";
            case 1:
                return "7d";
            case 2:
                return "30d";
            default:
                return "Unknown";
        }
    };
    const t = new Table();
    console.log(dataUSD);
    data.forEach((e, i) => {
        t.cell("INTERVAL", getInterval(i));
        t.cell("FUD", e[0].toFixed(2));
        t.cell("FOMO", e[1].toFixed(2));
        t.cell("ALPHA", e[2].toFixed(2));
        t.cell("KEK", e[3].toFixed(2));
        t.cell("USD", dataUSD[i]);
        t.newRow();
    });

    const message = `Parcel ${parcelId} claimed Alchemica \n ${t.toString()}`;
    return message;
};

const getAlchemicaClaimedEvents = async (
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

const fetchParcels = async (address) => {
    let query = `
      {parcels(where: {owner: "${address}"}) {
        id
      }}
      `;

    const result = await apolloFetch({ query });
    return result.data.parcels.map((e) => parseInt(e.id));
};

// Calc Parcel Revenue
const getClaimedAlchemicaParcelRevenue = async (parcelIds = []) => {
    // get Parcels
    let currentTimestamp = parseInt((new Date().getTime() / 1000).toString());

    let parcels =
        parcelIds.length != 0
            ? parcelIds
            : await fetchParcels(OWNER_WALLET_ADDRESS);
    const results = await Promise.all([
        getAlchemicaClaimedEvents(
            parcels,
            currentTimestamp - TIME_INTERVAL_24h,
            currentTimestamp
        ),
        getAlchemicaClaimedEvents(
            parcels,
            currentTimestamp - TIME_INTERVAL_7d,
            currentTimestamp
        ),
        getAlchemicaClaimedEvents(
            parcels,
            currentTimestamp - TIME_INTERVAL_30d,
            currentTimestamp
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

    let data = [];
    parcels.forEach((parcelId) => {
        // daily, weekly, monthly
        let parcelSums = [];
        results.forEach((r, i) => {
            let parcelResultsFilter = r.filter(
                (f) => parseInt(f.realmId) == parcelId
            );
            parcelSums.push(sumAlchemica(parcelResultsFilter));
        });

        let parcelSumsUSD = [];
        parcelSums.forEach((f, j) => {
            parcelSumsUSD[j] = f.reduce((prev, next, index) => {
                let value = 0;

                // if first init with price
                if (index == 1) {
                    value = prev * alchemicaPrices[0];
                } else {
                    value = prev;
                }

                value += next * alchemicaPrices[index];
                return value;
            });
        });

        parcelSumsUSD = parcelSumsUSD.map((e) => e.toFixed(2));

        let parcelTable = formatAlchemicaClaimedParcelMessage(
            parcelId,
            parcelSums,
            parcelSumsUSD
        );
        data.push({
            gotchiId: parcelId,
            data: parcelSums,
            message: parcelTable,
        });
    });

    return data;
};

const fetchAlchemicaPrices = () => {};

// Discord Bot
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const Discord = require("discord.js");
const client = new Discord.Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});
client.login(DISCORD_BOT_TOKEN);
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    const commandBody = message.content.slice("!".length);
    const args = commandBody.split(" ");
    const command = args.shift()?.toLowerCase();
    if (command == "gotchi" && args.length > 0) {
        await updateAlchemicaPrices();
        let result = await getChanneledAlchemicaRevenue([parseInt(args[0])]);
        let oneBigMessage = result.map((e) => e.message).join("\n");
        message.reply("```\n" + oneBigMessage + "```");
    } else if (command == "parcel" && args.length > 0) {
        await updateAlchemicaPrices();
        let result = await getClaimedAlchemicaParcelRevenue([
            parseInt(args[0]),
        ]);

        let oneBigMessage = result.map((e) => e.message).join("\n");
        message.reply("```\n" + oneBigMessage + "```");
    } else if (command == "stats") {
        await updateAlchemicaPrices();
        let gotchiIds = await fetchGotchiIds(args[1] || OWNER_WALLET_ADDRESS);
        let channeledRevenue = getChanneledAlchemicaRevenue(gotchiIds);
        let parcelIds = await fetchParcels(args[1] || OWNER_WALLET_ADDRESS);
        let claimedRevenue = await getClaimedAlchemicaParcelRevenue(parcelIds);

        message.reply(`
            Daily report on DD/MM/YYYY for your assets managed by Metaguild
            Owner address: ${OWNER_WALLET_ADDRESS}

            Total Gotchis: ${gotchiIds.length}
            Total Parcels: ${parcelIds.length}

            --------------------- CHANNELING STATS ---------------------

            INTERVAL  FUD      FOMO     ALPHA   KEK     Channels  USD
            --------  -------  -------  ------  ------  --------  ------
            24h       105.20   52.60    26.30   10.52   31/31     31
            7d        735.20   367.60   183.80  73.52   210/217   123
            30d       3124.60  1562.30  781.15  312.46  870/930   401

            --------------------- HARVESTING STATS ---------------------

            INTERVAL  FUD      FOMO     ALPHA   KEK     HARVESTS  USD
            --------  -------  -------  ------  ------  --------  ------
            24h       105.20   52.60    26.30   10.52   8/9       31
            7d        735.20   367.60   183.80  73.52   110/117   123
            30d       3124.60  1562.30  781.15  312.46  870/930   401
        `);
    } else {
        message.reply(
            "Allowed Commands are: \n- !gotchi <gotchiId>\n- !parcel <realmId>\n-!stats (<address>)"
        );
    }

    return;
});
