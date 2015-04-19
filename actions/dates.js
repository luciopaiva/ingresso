
"use strict";

var
    request = require('request'),
    xml2js = require('xml2js').parseString,
    url = require('../utils/url'),
    config = require('../config');


function date2model(date) {

    return date.$.Data;
}

function fetchAvailableDates(movie, next) {
    var
        address = url.compose(config.host.base, config.host.dates.url, config.host.dates.params, {
            'movieId': movie.id
        });

    request(address, function (requestErr, response, body) {

        if (!requestErr && response.statusCode === 200) {

            xml2js(body, function (xmlErr, result) {

                if (!xmlErr) {
                    next(null, movie, result.DatasHorasResponse.DatasHorasResult[0].DataHora.map(date2model));
                } else {
                    next(xmlErr);
                }
            });

        } else {
            next(requestErr);
        }
    });

}

function checkIfDateQueryMatches(dateQuery, movie, availableDates, next) {

    if (availableDates.length == 1) {
        next(null, movie, availableDates[0]);
    } else {
        console.info('Available dates:');
        availableDates.forEach(function (date) {
            console.info('\t%s', date);
        });

        if (dateQuery) {
            availableDates = availableDates.filter(function (date) {
                return date.indexOf(dateQuery) != -1;
            });
        }

        if (availableDates.length == 1) {
            console.info('Selected date "%s".', availableDates[0]);
            next(null, movie, availableDates[0]);
        } else {
            next('Please choose one of the dates above to continue.');
        }
    }
}

module.exports = {
    fetchAvailableDates: fetchAvailableDates,
    checkIfDateQueryMatches: checkIfDateQueryMatches
};
