
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
                    planta = result.PlantaResponse.PlantaResult[0].Planta[0];

                // The parameters "Linhas" and "Colunas" are not trustable. Have to calculate them manually.
                //var
                //    lines = parseInt(planta.$.Linhas, 10),
                //    columns = parseInt(planta.$.Colunas, 10);

                if (!xmlErr) {
                    next(null, planta.Cadeira.map(seat2model));
                } else {
                    next(xmlErr);
                }
            });

        } else {
            next(requestErr);
        }
    });

}

function findMapBounds(seats) {
    var
        lines = 0, columns = 0;

    seats.forEach(function (seat) {
        if (seat.line > lines) {
            lines = seat.line;
        }
        if (seat.column > columns) {
            columns = seat.column;
        }
    });

    lines++;
    columns++;

    return {
        lines: lines,
        columns: columns
    };
}

function createMap(width, height) {
    var
        i, j,
        map = [];

    for (i = 0; i < width; i++) {
        map[i] = [];

        for (j = 0; j < height; j++) {
            map[i][j] = chalk.gray('_');
        }
    }

    return map;
}

function displaySeats(seats, next) {
    var
        bounds,
        map,
        kinds = {};

    bounds = findMapBounds(seats);
    map = createMap(bounds.lines, bounds.columns);

    seats.forEach(function (seat) {
        var stat = seat.status;
        kinds[seat.kind] = true;

        switch (seat.kind) {
            case 'L':
                map[seat.line][seat.column] = chalk.blue(seat.id);
                break;
            case 'C':
            case 'D':
                map[seat.line][seat.column] = stat === 'L' ? chalk.green(seat.kind) : chalk.red(stat);
                break;
            default:
                map[seat.line][seat.column] = chalk.gray(seat.kind);
        }
    });

    console.info('Seat kinds: %s', Object.keys(kinds).join(', '));
    console.info('Seat map:');
    map.forEach(function (line, i) {
        var
            lineStr = '\t';
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
