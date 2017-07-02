
const
    config = require('../../config'),
    chalk = require('chalk');


class Logger {

    static error(message) {
        const timestamp = (new Date()).toISOString();
        Logger.log(chalk.gray(timestamp) + ': ' + chalk.red(message));
    }

    static debug(message) {
        if (config.WANTS_DEBUG_LOG) {
            const timestamp = (new Date()).toISOString();
            Logger.log(chalk.gray(timestamp) + ': ' + chalk.magenta(message));
        }
    }

    static info(message) {
        Logger.log(message, null);
    }

    static log(message) {
        console.info(message);
    }
}

module.exports = Logger;
