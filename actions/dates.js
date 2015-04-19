
"use strict";

var
    request = require('request'),
    async = require('async'),
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
                    next(null, result.DatasHorasResponse.DatasHorasResult[0].DataHora.map(date2model));
                } else {
                    next(xmlErr);
                }
            });

        } else {
            next(requestErr);
        }
    });

}

module.exports = function (movie, cb) {

    async.waterfall([
        fetchAvailableDates.bind(null, movie)
    ], cb);
};
