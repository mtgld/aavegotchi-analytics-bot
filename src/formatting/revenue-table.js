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
        t.cell("INTERVAL", getInterval(i));
        t.cell("FUD", e.alchemica[0].toFixed(2));
        t.cell("FOMO", e.alchemica[1].toFixed(2));
        t.cell("ALPHA", e.alchemica[2].toFixed(2));
        t.cell("KEK", e.alchemica[3].toFixed(2));
        if (e.harvests) {
            t.cell(
                "HARVESTS",
                `${e.harvests / 4}/${e.parcels * getHarvestMultiplier(i)}`
            );
        }

        if (e.channels) {
            t.cell(
                "CHANNELS",
                `${e.channels}/${e.gotchis * getChannelMultiplier(i)}`
            );
        }
        t.cell("USD", e.usd.toFixed(2));
        t.newRow();
    });

    return t.toString();
};

module.exports = {
    revenueTable,
};