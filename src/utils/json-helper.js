
const
    chalk = require("chalk"),
    fetch = require("node-fetch");

/**
 * @param {String} url
 * @return {Promise<*>} array of movie descriptions
 */
async function getJson(url) {
    const response = await fetch(url);
    if (response.ok) {
        return response.json();
    } else {
        console.error(chalk.red(`Error fetching JSON at ${url}. Response status was ${response.status} ` +
            `(message: ${response.statusText}).`));
        process.exit(1);
    }
}

module.exports = {
    getJson
};
