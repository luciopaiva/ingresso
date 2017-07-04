#!/usr/bin/env node
"use strict";

const
    fs = require('fs'),
    SeatMap = require('./src/sessions/seatmap'),
    SeatMapUtils = require('./src/sessions/seatmap-utils');


/**
 * Given a directory with TSV files of a certain session, draw seat map occupancy progression through time.
 */
class SeatMapTimeline {

    constructor (sessionId) {
        this.sessionId = sessionId;
    }

    run() {
        const progression = [...this.obtainSeatsProgressionThroughTime()];

        progression.forEach(([timestamp, seats]) => {
            // console.info(`${timestamp}: ${seats}`)

            console.info(timestamp);
            SeatMap.show(seats);
        });
    }

    *obtainSeatsProgressionThroughTime() {
        const sessionDirectory = SeatMapUtils.SEAT_MAP_DIRECTORY_PREFIX + this.sessionId;
        process.chdir(sessionDirectory);

        const fileNames = fs.readdirSync('.')
            .filter(fileName => fileName.endsWith(SeatMapUtils.SEAT_MAP_FILE_NAME_EXTENSION))
            .sort();

        if (fileNames.length === 0) {
            console.info('No TSV files found.');
            yield [];
        } else {
            for (const fileName of fileNames) {
                const seats = SeatMapUtils.parseSeatsFromTsvFile(fileName);

                const timeStartPos = SeatMapUtils.SEAT_MAP_FILE_NAME_PREFIX.length;
                const timeEndPos = fileName.length - SeatMapUtils.SEAT_MAP_FILE_NAME_EXTENSION.length;
                yield [fileName.substring(timeStartPos, timeEndPos), seats];
            }
        }
    }
}

/**
 * @param {string} sessionId
 * @returns {void}
 */
function main(sessionId) {
    if (!sessionId) {
        console.info('Usage: seatmap-timeline <session-id>');
        process.exit(0);
    }

    const seatMapTimeline = new SeatMapTimeline(sessionId);
    seatMapTimeline.run();
}

main(...process.argv.slice(2));
