"use strict";

const
    chalk = require('chalk'),
    XmlHelper = require('../utils/xml-helper'),
    logger = require('../utils/logger'),
    composeUrl = require('../utils/compose-url'),
    {looseMatch} = require('../utils/string'),
    config = require('../../config'),
    EventPlace = require('../events/event-place');


/**
 * @param {Map<string, EventPlace[]>} eventPlacesByTheaterName
 * @param {string} sessionQuery
 */
function dumpList(eventPlacesByTheaterName, sessionQuery) {
    for (const [theaterName, eventPlaces] of eventPlacesByTheaterName.entries()) {
        if (eventPlaces.length > 0) {
            let markedTheaterName = theaterName;
            looseMatch(theaterName, sessionQuery, c => chalk.inverse(c), result => markedTheaterName = result);
            logger.info(chalk.yellow('↪ ') + chalk.green(markedTheaterName) +
                chalk.gray(` (${eventPlaces[0].neighborhood})`));
            for (const eventPlace of eventPlaces) {
                logger.info('\t' + eventPlace.toString());
            }
        }
    }
}

/**
 * Group event places by theater, for displaying purposes.
 *
 * @param {EventPlace[]} eventPlaces
 * @return {Map<string, EventPlace[]>}
 */
function groupByTheaterName(eventPlaces) {
    const eventPlacesByTheaterName = new Map();
    for (const eventPlace of eventPlaces) {
        let places = eventPlacesByTheaterName.get(eventPlace.theaterName);
        if (!places) {
            places = [];
            eventPlacesByTheaterName.set(eventPlace.theaterName, places);
        }
        places.push(eventPlace);
    }
    return eventPlacesByTheaterName;
}

/**
 * Will change event places' contents!
 *
 * @param {EventPlace[]} eventPlaces - list of movies to run query against
 * @param {string} query - the query to run. Will "loosely" match the query by inserting wildcards between each char.
 *                         This means that, for instance, 'foo' will match against 'bfaoro'.
 * @return {EventPlace[]} - filtered array of event places and their filtered sessions
 */
function filterEventPlaces(eventPlaces, query) {
    return eventPlaces.filter(eventPlace => {
        // start by filtering event place sessions...
        eventPlace.sessions = eventPlace.sessions
            .filter(session => looseMatch(eventPlace.toSearchableString() + session.toSearchableString(), query));
        // ...and keep event place only if at least one session stayed
        return eventPlace.sessions.length > 0;
    });
}

class Sessions {

    /**
     * @param {Event} event - the event whose sessions are being searched for
     * @param {EventDate} date - the date of the event
     * @param {string} sessionQuery - a string to help narrowing down the search
     * @return {Session} the selected session
     */
    static async search(event, date, sessionQuery) {
        const url = composeUrl(config.host.base, config.host.sessions.url, config.host.sessions.params, {
            eventId: event.id,
            date: date
        });
        logger.debug(`Fetching available sessions... ('${url}')`);
        const xmlResponse = await XmlHelper.request(url);

        const allEventPlaces = xmlResponse.queryByTagName(EventPlace.XML_TAG_NAME)
            .map(node => EventPlace.fromXml(node));

        if (!sessionQuery && allEventPlaces.length > 1) {
            logger.info(`List of sessions found (${allEventPlaces.length}):`);
            dumpList(groupByTheaterName(allEventPlaces), sessionQuery);
            logger.info('Now choose a session.');
        } else {
            const filteredPlaces = sessionQuery ? filterEventPlaces(allEventPlaces, sessionQuery) : allEventPlaces;

            if (filteredPlaces.length > 1 ||
                (filteredPlaces.length === 1 && filteredPlaces[0].sessions.length > 1)) {
                logger.info(`List of sessions that matched (${filteredPlaces.length} of ${allEventPlaces.length}):`);
                dumpList(groupByTheaterName(filteredPlaces), sessionQuery);
                logger.info('Trying narrowing down your search.');
            } else if (filteredPlaces[0].sessions.length === 1) {
                const place = filteredPlaces[0];
                const session = place.sessions[0];
                logger.info('Selected theater: ' + chalk.green(place.theaterName));
                logger.info('Selected session: ' + chalk.green(place.toString()) +
                    chalk.gray(` [session id: ${session.sessionId}] [sector id: ${session.sectorId}]`));
                return session;
            } else {
                logger.info('Nothing found. Try broadening your search.');
            }
        }

        return null;
    }
}

module.exports = Sessions;
