"use strict";

const
    chalk = require('chalk'),
    XmlHelper = require('../utils/xml-helper'),
    logger = require('../utils/logger'),
    composeUrl = require('../utils/compose-url'),
    config = require('../../config'),
    Seat = require('./seat');


class SeatMap {

    /**
     * @param {Session} session - the session whose seat map is going to be fetched
     * @return {Promise}
     */
    static async fetch(session) {
        // request seat map
        const url = composeUrl(config.host.base, config.host.seatmap.url, config.host.seatmap.params, {
            sessionId: session.sessionId,
            sectorId: session.sectorId
        });
        logger.debug(`Fetching seat map... ('${url}')`);
        return await XmlHelper.request(url);
    }

    /**
     * @param {Object} xml - the XML to parse
     * @return {Seat[]} a collection of seats
     */
    static parseSeats(xml) {
        // check there's a map first
        let mapElement = xml.queryByTagName('planta');
        if (mapElement < 1) {
            logger.error('Server answer returned no map!');
            return null;
        }
        mapElement = mapElement[0];

        // check if response contains any errors
        if (!!mapElement['detalhesdoerro']) {
            logger.error('Seat map is not available for this session.');
            return null;
        }

        // create and return seats
        return mapElement['cadeira'].map(rawSeat => Seat.fromXml(rawSeat));
    }

    /**
     * @param {Seat[]} seats - collection of seats
     * @return {void}
     */
    static show(seats) {
        // calculate room bounds
        let width = 1 + seats.map(seat => seat.column).reduce((max, col) => Math.max(max, col), 0);
        let height = 1 + seats.map(seat => seat.row).reduce((max, row) => Math.max(max, row), 0);

        SeatMap.prepareAndDrawMap(seats, width, height);
    }

    /**
     * @private
     * @param {Seat[]} seats
     * @param {number} width
     * @param {number} height
     */
    static prepareAndDrawMap(seats, width, height) {
        // fill map with seats info
        const map = (new Array(width * height)).fill(' ');
        for (const seat of seats) {
            map[seat.column + width * seat.row] = seat.symbol;
        }

        // draw map
        const border = Seat.TILE_BORDER;
        logger.info('\n  ' + border.repeat(2 * (width + 2) + 1));
        for (let row = 0; row < height; row++) {
            const leftBorder = Seat.TILE_FLOOR + Seat.TILE_FLOOR + border + border + Seat.TILE_FLOOR;
            const rightBorder = ' ' + border + border;
            const joiner = map[row * width] === Seat.TILE_STAGE ? Seat.TILE_STAGE : Seat.TILE_FLOOR;
            const rowSymbols = map.slice(row * width, (row + 1) * width).join(joiner);
            logger.info(leftBorder + rowSymbols + rightBorder);
        }
        logger.info('  ' + border.repeat(2 * (width + 2) + 1));
    }

    static debugSeats(seats) {
        for (const seat of seats) {
            logger.info(seat.toString());
        }
    }
}

module.exports = SeatMap;
