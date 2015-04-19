
"use strict";

var
    request = require('request'),
    async = require('async'),
    xml2js = require('xml2js').parseString,
    chalk = require('chalk'),
    url = require('../utils/url'),
    config = require('../config');


function seat2model(seat) {

    return {
        id: seat.$.IdLugar,
        line: parseInt(seat.$.Linha, 10) - 1,
        column: parseInt(seat.$.Coluna, 10) - 1,
        status: seat.$.Status,
        kind: seat.$.Tipo,
        subKind: seat.$.SubTipo
    };
}

function fetchAvailableDates(session, next) {
    var
        address = url.compose(config.host.base, config.host.seatmap.url, config.host.seatmap.params, {
            'sessionId': session.id
        });

    request(address, function (requestErr, response, body) {

        if (!requestErr && response.statusCode === 200) {

            xml2js(body, function (xmlErr, result) {
                var
                    planta = result.PlantaResponse.PlantaResult[0].Planta[0],
                    lines = parseInt(planta.$.Linhas, 10),
                    columns = parseInt(planta.$.Colunas, 10);

                if (!xmlErr) {
                    next(null, lines, columns, planta.Cadeira.map(seat2model));
                } else {
                    next(xmlErr);
                }
            });

        } else {
            next(requestErr);
        }
    });

}

function displaySeats(lines, columns, seats, next) {
    var
        i, j,
        map = [],
        kinds = {};

    for (i = 0; i <= lines; i++) {
        map[i] = [];

        for (j = 0; j <= columns; j++) {
            map[i][j] = chalk.gray('_');
        }
    }

    console.info('Lines: %d', lines);
    console.info('Columns: %d', columns);

    seats.forEach(function (seat) {
        var stat = seat.status;
        kinds[seat.kind] = true;
        map[seat.line][seat.column] = stat === 'L' ? chalk.green(stat) : chalk.red(stat);
    });

    console.info('Seat kinds: %s', Object.keys(kinds).join(', '));
    console.info('Seat map:');
    map.forEach(function (line, i) {
        var
            lineStr = '';
        line.forEach(function (column, j) {
            lineStr += map[i][j] + ' ';
        });
        console.info('%s', lineStr);
    });

    next();
}

module.exports = function (session, cb) {

    async.waterfall([
        fetchAvailableDates.bind(null, session),
        displaySeats
    ], cb);
};
