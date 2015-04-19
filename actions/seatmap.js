
"use strict";

var
    request = require('request'),
    async = require('async'),
    xml2js = require('xml2js').parseString,
    chalk = require('chalk'),
    url = require('../utils/url'),
    str = require('../utils/string'),
    config = require('../config');


function seat2model(seat) {
    /**
     * Seat kinds:
     * - C: chair (cadeira)
     * - D: chair for people with disabilities (deficiente)
     * - P: stage (palco)
     * - L: legend (legenda)
     *
     * Chair subkinds (chair kind is 'C', unless noted otherwise):
     * - N000: common chair
     * - T000: chair with liftable armrests
     * - O000: chair for obese people
     * - D000: chair for disabled people (chair kind 'D')
     * - H000: helper for impaired person
     * - X000: person with reduced mobility
     */

    var
        kind = seat.$.Tipo,
        subKind = seat.$.SubTipo,
        cid = seat.$.IdLugar,
        status = seat.$.Status,
        symbol;

    switch (kind) {
        case 'C':
        case 'D':

            switch (subKind[0]) {
                case 'N':
                    symbol = status == 'L' ? '\u25A0' : '\u25A1';
                    break;
                case 'T':
                    symbol = '\u2665';
                    break;
                case 'O':
                    symbol = 'B';
                    break;
                case 'D':
                    symbol = '\u267F';
                    break;
                case 'X':
                    symbol = 'R';
                    break;
                case 'H':
                    symbol = 'H';
                    break;
                default:
                    symbol = subKind[0];
            }

            switch (status) {
                case 'L':
                    symbol = chalk.green(symbol);
                    break;
                case 'B':
                case 'O':
                    symbol = chalk.red(symbol);
                    break;
                default:
                    symbol = chalk.yellow(status);
            }
            break;
        case 'P':
            symbol = chalk.gray(' ');
            break;
        case 'L':
            symbol = chalk.blue(cid);
            break;
        default:
    }

    return {
        id: cid,
        line: parseInt(seat.$.Linha, 10) - 1,
        column: parseInt(seat.$.Coluna, 10) - 1,
        status: status,
        kind: kind,
        subKind: subKind,
        symbol: symbol
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
        columnsLabels = [],
        bounds,
        map;

    bounds = findMapBounds(seats);
    map = createMap(bounds.lines, bounds.columns);

    for (var i = 0; i < bounds.columns; i++) {
        columnsLabels[i] = '  ';
    }

    seats.forEach(function (seat) {
        var
            cid = str.onlyNumbers(seat.id);
        if (columnsLabels[seat.column] === '  ' && cid) {
            columnsLabels[seat.column] = (cid.length != 2 ? '0' + cid : cid) + '';
        }
        map[seat.line][seat.column] = seat.symbol;
    });

    console.info('Seat map:');
    console.info('\t' + chalk.blue(columnsLabels.map(function (l) { return l[0]; }).join(' ')));
    console.info('\t' + chalk.blue(columnsLabels.map(function (l) { return l[1]; }).join(' ')));
    map.forEach(function (line, i) {
        var
            lineStr = '\t';
        line.forEach(function (column, j) {
            lineStr += map[i][j] + ' ';
        });
        console.info('%s', lineStr);
    });

    next(null);
}

function displayLegend(next) {

    console.info('Legend:');
    console.info('\t%s seat (free)', chalk.green('\u25A0'));
    console.info('\t%s seat (taken)', chalk.red('\u25A1'));
    console.info('\t\u2665 seat with liftable armrests');
    console.info('\tB seat for pregnant / obese person');
    console.info('\tH seat for companion of person with disability');
    console.info('\t\u267F reserved for wheelchair');
    console.info('\tE unknown seat - maybe narrow?');

    next();
}

module.exports = function (session, cb) {

    async.waterfall([
        fetchAvailableDates.bind(null, session),
        displaySeats,
        displayLegend
    ], cb);
};
