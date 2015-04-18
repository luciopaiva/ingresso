
"use strict";

var
    sessions = require('./actions/sessions'),
    movies = require('./actions/movies');

function main(action) {
    var
        params = Array.prototype.slice.call(arguments, 1);

    switch (action) {
        case 'movies':
            console.time('fetch-movies');
            movies(function (err, result) {
                result.forEach(function (movie) {
                    console.info('%s (%s)', movie.name, movie.id);
                });
                console.info('Total: %d', result.length);
                console.timeEnd('fetch-movies');
            });
            break;
        case 'sessions':
            console.time('fetch-sessions');
            sessions(params[0], function(err, result) {
                result.forEach(function (session) {
                    console.dir(session.sessions);
                });
                console.info('Total: %d', result.length);
                console.timeEnd('fetch-sessions');
            });
            break;
        default:
            if (action) {
                console.error('Unknown action "%s"', action);
            }
            console.error('How to use:\n\tnode ingresso <action>');
    }

}

main.apply(null, process.argv.slice(2));

function howToUse() { /*
    node ingresso movies chappie downtown today
*/ }
