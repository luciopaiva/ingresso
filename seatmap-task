#!/usr/bin/env node
"use strict";

const
    fs = require('fs'),
    moment = require('moment'),
    mkdirp = require('mkdirp'),
    Seat = require('./src/sessions/seat'),
    SeatMap = require('./src/sessions/seatmap'),
    Session = require('./src/sessions/session');

const
    LOG_FILE_NAME = 'seatmap.log',
    SEAT_MAP_FILE_NAME_PREFIX = 'seatmap-',
    SEAT_MAP_FILE_NAME_EXTENSION = '.tsv',
    SEAT_MAP_DIRECTORY_PREFIX = 'seatmap-';


class SeatMapTask {

    /**
     * @param {string} sessionId
     * @param {string} sectorId
     */
    constructor (sessionId, sectorId) {
        this.sessionId = sessionId;
        this.sectorId = sectorId;
        this.seats = null;

        this.enterSeatMapDirectory();
        this.openLogFile();
        this.log('-'.repeat(80));
        this.log('Script starting...');
    }

    async run() {
        try {
            const selectedSession = new Session(this.sessionId, this.sectorId);
            this.log('Fetching seat map...');
            const seatMapXml = await SeatMap.fetch(selectedSession);
            this.log('Parsing seats...');
            this.seats = SeatMap.parseSeats(seatMapXml);
            this.log('Seats found: ' + this.seats.length);
            const seatsAvailable = countSeatsAvailable(this.seats);
            this.log('Seats free: ' + seatsAvailable);

            const previousSeatsAvailable = this.obtainPreviousSeatsAvailable();
            if (seatsAvailable !== previousSeatsAvailable) {
                this.log(`Changed from ${previousSeatsAvailable} to ${seatsAvailable} seats available. Writing TSV...`);
                this.dumpSeatsToTsv();
            } else {
                this.log('There was no changes since the last run.');
            }

        } catch (error) {
            this.log(error && error.stack || 'Unknown error');
        }

        this.log('Script finished.');
    }

    /**
     * Finds the most recent seat map snapshot downloaded and return the number of free seats.
     * @return {number} number of available seats or -1 if no previous snapshot was found
     */
    obtainPreviousSeatsAvailable() {
        const fileNames = fs.readdirSync('.').filter(fileName => fileName.endsWith('.tsv'));
        if (fileNames.length === 0) {
            this.log('There is no previous seat map to compare with.');
            return -1;
        } else {
            const previousSeatsFileName = fileNames.pop();
            this.log(`Previous seats file name is "${previousSeatsFileName}".`);

            const seatsRaw = fs.readFileSync(previousSeatsFileName, 'utf-8').split('\n')
                .filter(line => line.length > 0);
            const seats = seatsRaw.map(seatRaw => {
                try {
                    return Seat.fromTsvRow(seatRaw);
                } catch (error) {
                    this.log(`Error parsing seat line: "${seatRaw}"`);
                    throw error;
                }
            });
            return countSeatsAvailable(seats);
        }
    }

    dumpSeatsToTsv() {
        const timestamp = moment().format('YYYYMMDD-HHmmss');
        const fd = fs.openSync(SEAT_MAP_FILE_NAME_PREFIX + timestamp + SEAT_MAP_FILE_NAME_EXTENSION, 'w');
        for (const seat of this.seats) {
            fs.writeSync(fd, seat.toTsvRow() + '\n', null, 'utf-8');
        }
        fs.closeSync(fd);
    }

    enterSeatMapDirectory() {
        const dirName = SEAT_MAP_DIRECTORY_PREFIX + this.sessionId;
        mkdirp.sync(dirName);
        process.chdir(dirName);
    }

    openLogFile() {
        this.logFileDesc = fs.openSync(LOG_FILE_NAME, 'a');
    }

    log(msg) {
        const timestamp = (new Date()).toISOString();
        fs.writeSync(this.logFileDesc, `${timestamp}: ${msg}\n`, null, 'utf-8');
    }
}

function countSeatsAvailable(seats) {
    return seats.reduce((count, seat) => count + (seat.isAvailable() ? 1 : 0), 0);
}

/**
 * @param {string} sessionId
 * @param {string} sectorId
 * @returns {void}
 */
async function main(sessionId, sectorId) {
    if (!sessionId || !sectorId) {
        console.info('Usage: seatmap <session-id> <sector-id');
        process.exit(0);
    }

    const seatMapTask = new SeatMapTask(sessionId, sectorId);
    await seatMapTask.run();
}

main(...process.argv.slice(2));
