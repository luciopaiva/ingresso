#!/usr/bin/env node
"use strict";

const
    SeatMap = require('./src/sessions/seatmap'),
    Session = require('./src/sessions/session');

/**
 *
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

        // const XmlHelper = require('./src/utils/xml-helper');
        // const seatMapXml = await XmlHelper.parse(require('fs').readFileSync('./sample-xmls/seatmap.xml', 'utf-8'));
        SeatMap.show(seats);

    } catch (error) {
        console.error(error);
    }
}

main(...process.argv.slice(2));
