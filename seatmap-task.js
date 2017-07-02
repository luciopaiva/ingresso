#!/usr/bin/env node
"use strict";

const
    SeatMap = require('./src/sessions/seatmap'),
    Session = require('./src/sessions/session');

/**
 * @param {string} sessionId
 * @param {string} sectorId
 * @returns {void}
 */
async function main(sessionId, sectorId) {
    if (!sessionId) {
        console.info('Usage: seatmap <session-id> <sector-id');
        process.exit(0);
    }

    try {
        const selectedSession = new Session(sessionId, sectorId);
        const seatMapXml = await SeatMap.fetch(selectedSession);
        const seats = SeatMap.parseSeats(seatMapXml);

        // ToDo compare with last run and exit if still the same
        // ToDo dump seats to file otherwise

    } catch (error) {
        console.error(error);
    }
}

main(...process.argv.slice(2));
