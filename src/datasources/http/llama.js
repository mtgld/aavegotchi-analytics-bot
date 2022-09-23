const { default: axios } = require("axios");

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

const fetchAlchemicaPrices = async () => {
    let alchemicaPrices = [0, 0, 0, 0];
    let tokens = REVENUE_TOKENS.map((e) => `polygon:${e}`).join(",");
    const values = await axios.get(
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

    return alchemicaPrices;
};

module.exports = {
    fetchAlchemicaPrices,
};
