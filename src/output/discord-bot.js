const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const GOTCHI_IDS =
    process.env.GOTCHI_IDS?.split(",").map((e) => parseInt(e)) || [];

const OWNER_WALLET_ADDRESS = process.env.ORIGINAL_OWNER_WALLET_ADDRESS;

const Discord = require("discord.js");
const {
    fetchGotchiIdsOf,
} = require("../datasources/subgraphs/aavegotchi-core");
const {
    getParcelsOf,
} = require("../datasources/subgraphs/aavegotchi-gotchiverse");
const { revenueTable } = require("../formatting/revenue-table");
const { channeledAlchemicaWithUSD } = require("../stats/gotchi-revenue");
const { claimedAlchemicaWithUSD } = require("../stats/parcel-revenue");

const startGotchiManagerBot = () => {
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
            let result = await channeledAlchemicaWithUSD([parseInt(args[0])]);
            message.reply(`\`\`\`
Channeled Alchemica report for Gotchi ${args[0]}

---------------- CHANNELING STATS ----------------

${revenueTable(result.overallDataIntervals)}\`\`\``);
        } else if (command == "parcel" && args.length > 0) {
            let result = await claimedAlchemicaWithUSD([parseInt(args[0])]);
            message.reply(`\`\`\`
Claimed Alchemica report for Parcel ${args[0]}

---------------- HARVESTING STATS ----------------

${revenueTable(result.overallDataIntervals)}\`\`\``);
        } else if (command == "stats") {
            let gotchIdsAmount = 0;
            let parcelIdsAmount = 0;
            const wallet = args[0] || OWNER_WALLET_ADDRESS;
            const [channeledRevenue, claimedRevenue] = await Promise.all([
                fetchGotchiIdsOf(wallet).then((gotchiIds) => {
                    gotchIdsAmount = gotchiIds.length;
                    return channeledAlchemicaWithUSD(gotchiIds);
                }),
                getParcelsOf(wallet).then((parcelIds) => {
                    parcelIdsAmount = parcelIds.length;
                    return claimedAlchemicaWithUSD(parcelIds);
                }),
            ]);

            message.reply(`\`\`\`
Address: ${wallet}
Total Gotchis: ${await gotchIdsAmount}
Total Parcels: ${await parcelIdsAmount}
SO is average spillover

--------------------- CHANNELING STATS ------------------

${revenueTable(channeledRevenue.overallDataIntervals)}

--------------------- HARVESTING STATS ------------------

${revenueTable(claimedRevenue.overallDataIntervals)}
\`\`\``);
        } else {
            message.reply(
                "Allowed Commands are: \n- !gotchi <gotchiId>\n- !parcel <realmId>\n-!stats (<address>)"
            );
        }

        return;
    });
};

module.exports = {
    startGotchiManagerBot,
};
