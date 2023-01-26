const EasyTable = require("easy-table");

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

const getHarvestMultiplier = (index) => {
    switch (index) {
        case 0:
            return 1;
        case 1:
            return 14;
        case 2:
            return 60;
        default:
            return 1;
    }
};

const getChannelMultiplier = (index) => {
    switch (index) {
        case 0:
            return 1;
        case 1:
            return 7;
        case 2:
            return 30;
        default:
            return 1;
    }
};

const revenueTable = (intervals = []) => {
    const t = new EasyTable();
    intervals.forEach((e, i) => {
        t.cell("PER", getInterval(i));
        t.cell("FUD", e.alchemica[0].toFixed(0));
        t.cell("FOMO", e.alchemica[1].toFixed(0));
        t.cell("ALPHA", e.alchemica[2].toFixed(0));
        t.cell("KEK", e.alchemica[3].toFixed(0));
        if (e.harvests) {
            t.cell("HARVESTS", `${(e.harvests / 4).toFixed(0)}`);
        }

        if (e.channels) {
            t.cell(
                "CHANNELS",
                `${e.channels}/${e.gotchis * getChannelMultiplier(i)}`
            );
        }

        if (e.spilloverRate) {
            t.cell("SO", `${e.spilloverRate.toFixed(0)}%`);
        }
        t.cell("USD", e.usd, EasyTable.number(0));
        t.newRow();
    });

    return t.toString();
};

module.exports = {
    revenueTable,
};
