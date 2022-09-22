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

// Calc Channeled Alchemica Revenue
const TIME_INTERVAL_24h = 86400;
const TIME_INTERVAL_7d = 604800;
const TIME_INTERVAL_30d = 2592000;
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

const getChanneledAlchemicaRevenue = async () => {
    let currentTimestamp = parseInt((new Date().getTime() / 1000).toString());

    const results = await Promise.all([
        getChanneledAlchemicaEvents(
            GOTCHI_IDS.map((e) => parseInt(e)),
            currentTimestamp - TIME_INTERVAL_24h,
            currentTimestamp
        ),
        getChanneledAlchemicaEvents(
            GOTCHI_IDS,
            currentTimestamp - TIME_INTERVAL_7d,
            currentTimestamp
        ),
        getChanneledAlchemicaEvents(
            GOTCHI_IDS,
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
    GOTCHI_IDS.forEach((gotchiId) => {
        // daily, weekly, monthly
        let gotchiSums = [];
        results.forEach((r, i) => {
            let gotchiResultsInterval = r.filter((f) => f.gotchiId == gotchiId);
            gotchiSums.push(sumAlchemica(gotchiResultsInterval));
        });

        let gotchiTable = formatChanneledAlchemicaMessage(gotchiId, gotchiSums);
        data.push({
            gotchiId: gotchiId,
            data: gotchiSums,
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

    const message = `Gotchi ${gotchiId} channeled Alchemica \n ${t.toString()}`;
    return message;
};

const formatAlchemicaClaimedParcelMessage = (parcelId, data) => {
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

    console.log(query);
    let result = await apolloFetch({ query });
    console.log(result);
    return result.data.alchemicaClaimedEvents;
};

const getParcelsFrom = async (address) => {
    let query = `
      {parcels(where: {owner: "${address}"}) {
        id
      }}
      `;

    const result = await apolloFetch({ query });
    return result.data.parcels.map((e) => parseInt(e.id));
};

// Calc Parcel Revenue
const getClaimedAlchemicaParcelRevenue = async () => {
    // get Parcels
    let currentTimestamp = parseInt((new Date().getTime() / 1000).toString());

    console.log(currentTimestamp);

    let parcels = await getParcelsFrom(OWNER_WALLET_ADDRESS);
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

        let parcelTable = formatAlchemicaClaimedParcelMessage(
            parcelId,
            parcelSums
        );
        data.push({
            gotchiId: parcelId,
            data: parcelSums,
            message: parcelTable,
        });
    });

    return data;
};

// Discord Bot
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const Discord = require("discord.js");
const client = new Discord.Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"],
});
client.login(DISCORD_BOT_TOKEN);
client.on("messageCreate", async (message) => {
    console.log(message.content);
    if (message.author.bot) return;
    if (!message.content.startsWith("!")) return;

    const commandBody = message.content.slice("!".length);
    const args = commandBody.split(" ");
    const command = args.shift()?.toLowerCase();

    if (command == "gotchis") {
        let result = await getChanneledAlchemicaRevenue();
        let oneBigMessage = result.map((e) => e.message).join("\n");
        message.reply("\`\`\`\n" + oneBigMessage + "\`\`\`");
    } else if (command == "parcels") {
        let result = await getClaimedAlchemicaParcelRevenue();
        let oneBigMessage = result.map((e) => e.message).join("\n");
        message.reply("\`\`\`\n" + oneBigMessage + "\`\`\`");
    }

    return;
});
