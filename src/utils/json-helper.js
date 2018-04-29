
const
    chalk = require("chalk");
    request = require("request-promise-native");

/**
 * @param {String} url
 * @return {Promise<*>} array of movie descriptions
 */
async function getJson(url) {
    return await request({
        url: url,
        transform: (body, response) => {
            if (response.statusCode !== 200) {
                console.error(chalk.red(`Error fetching JSON at ${url}. Response status was ${response.statusCode}.`));
                process.exit(1);
            }
            return JSON.parse(body);
        }
    })
}

module.exports = {
    getJson
};
