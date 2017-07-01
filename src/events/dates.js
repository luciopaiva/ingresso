"use strict";

const
    chalk = require('chalk'),
    XmlHelper = require('../utils/xml-helper'),
    logger = require('../utils/logger'),
    composeUrl = require('../utils/compose-url'),
    {looseMatch} = require('../utils/string'),
    config = require('../../config'),
    EventDate = require('./event-date');


/**
 * @param {EventDate[]} dates
 */
function dumpDatesList(dates) {
    for (const date of dates) {
        logger.info(chalk.yellow('↪ ') + date.toString(true));
    }
}

/**
 *
 * @param {EventDate[]} dates - list of dates to run query against
 * @param {string} query - the query to run. Will "loosely" match the query by inserting wildcards between each char.
 *                         This means that, for instance, 'foo' will match against 'bfaoro'.
 * @return {EventDate[]}
 */
function filterDateList(dates, query) {
    return dates.filter(date => looseMatch(date.toString(), query));
}

class Dates {

    /**
     * @param {Event} event
     * @param {string} dateQuery - any part of the event date in the format `YEARmonthDAY` (e.g.: `20170701`)
     * @return {EventDate} selected event date, if there was only one match; otherwise, null
     */
    static async search(event, dateQuery) {
        const url = composeUrl(config.host.base, config.host.dates.url, config.host.dates.params, {eventId : event.id});
        logger.debug(`Fetching dates available... ('${url}')`);
        const xmlResponse = await XmlHelper.request(url);

        const allDates = xmlResponse.queryByTagName(EventDate.XML_TAG_NAME)
            .map(rawDate => rawDate.$)  // pluck attributes
            .map($ => new EventDate(event, $['Data']));

        if (!dateQuery && allDates.length > 1) {
            logger.info(`List of dates available (${allDates.length}):`);
            dumpDatesList(allDates);
            logger.info('\nNow choose a date.');
        } else {
            const filteredDates = dateQuery ? filterDateList(allDates, dateQuery) : allDates;

            if (filteredDates.length > 1) {
                logger.info(`List of dates that matched (${filteredDates.length} of ${allDates.length}):`);
                dumpDatesList(filteredDates);
                logger.info('Trying narrowing down your search.');
            } else {
                const date = filteredDates[0];
                logger.info('Selected date: ' + chalk.green(date.toString()));
                return date;
            }
        }

        return null;
    }
}

module.exports = Dates;
