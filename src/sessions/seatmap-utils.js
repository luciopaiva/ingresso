
const
    fs = require('fs'),
    Seat = require('./seat');


class SeatMapUtils {

    /**
     * @param {Seat[]} seats
     * @return {number}
     */
    static countSeatsAvailable(seats) {
        return seats.reduce((count, seat) => count + (seat.isAvailable() ? 1 : 0), 0);
    }

    static parseSeatsFromTsvFile(tsvFileName) {
        const seatsRaw = fs.readFileSync(tsvFileName, 'utf-8').split('\n').filter(line => line.length > 0);
        return seatsRaw.map(seatRaw => Seat.fromTsvRow(seatRaw));
    }

}

SeatMapUtils.LOG_FILE_NAME = 'seatmap.log';
SeatMapUtils.SEAT_MAP_FILE_NAME_PREFIX = 'seatmap-';
SeatMapUtils.SEAT_MAP_FILE_NAME_EXTENSION = '.tsv';
SeatMapUtils.SEAT_MAP_DIRECTORY_PREFIX = 'seatmap-';

module.exports = SeatMapUtils;
