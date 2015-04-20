
"use strict";

var
    //sessions = require('./actions/sessions'),
    movies = require('./actions/movies');


function caseMovies(movieFilter, dateFilter, theaterFilter, sessionQuery) {
    var
        label = 'Total elapsed time';

    console.time(label);
    movies(movieFilter, dateFilter, theaterFilter, sessionQuery, function (err) {
        if (err && err !== true) {
            console.error(err);
        }
        console.timeEnd(label);
    });
}

function main(action) {
    var
        params = Array.prototype.slice.call(arguments, 1);

    switch (action) {
        case 'movies':
            caseMovies(params[0], params[1], params[2], params[3]);
            break;
        //case 'sessions':
        //    console.time('fetch-sessions');
        //    sessions(params[0], function(err, result) {
        //        result.forEach(function (session) {
        //            console.dir(session.sessions);
        //        });
        //        console.info('Total: %d', result.length);
        //        console.timeEnd('fetch-sessions');
        //    });
        //    break;
        default:
            if (action) {
                console.error('Unknown action "%s"', action);
            }
            console.error('How to use:\n\tnode ingresso <action>');
    }

}

main.apply(null, process.argv.slice(2));

function howToUse() { /*
    node ingresso movies chappie today downtown
*/ }
