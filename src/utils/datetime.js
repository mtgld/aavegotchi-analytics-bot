const { DateTime } = require("luxon");

function getTimestampOfEndOfYesterday() {
    return DateTime.utc().minus({ days: 1 }).endOf("day").toUnixInteger();
}

module.exports = {
    getTimestampOfEndOfYesterday,
};
