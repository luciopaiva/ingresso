"use strict";

var
    request = require('request'),
    async = require('async'),
    xml2js = require('xml2js').parseString,
    fetchSessions = require('./sessions'),
    fetchAvailableDates = require('./dates'),
    fetchSeatMap = require('./seatmap'),
    url = require('../utils/url'),
    str = require('../utils/string'),
    config = require('../config');

var
    URL = url.compose(config.host.base, config.host.movies.url, config.host.movies.params);

function movie2model(movie) {
    // Raw movie description from XML:
    //
    //{ '$':
    //    { IdEspetaculo: '9143',
    //        NmEspetaculo: 'A série Divergente - Insurgente',
    //        ConteudoSinopse: 'Sequência de Divergente (2014), filme de ficção científica baseado no romance homônimo de Veronica Roth. A trama segue a aventura de Tris em um mundo distópico, onde ele deve esconder o fato de não pertencer a nenhuma facção oficial.',
    //        Genero: 'Aventura',
    //        Elenco: 'Naomi Watts, Shailene Woodley, Theo James, \nMiles Teller.',
    //        Diretoria: 'Robert Schwentke',
    //        NomeOriginal: 'Insurgent',
    //        NmClassif: '14 anos',
    //        TempoCartaz: 'Continuação',
    //        MediaAvaliacao: '0,0',
    //        QtdVotos: '0',
    //        Figura: 'http://storage.ingresso.com.br/img/cinema/cartaz/9143.jpg',
    //        FiguraDestaque: 'http://storage.ingresso.com.br/img/cinema/cartaz/9143_iphone.jpg',
    //        QuantidadeVendas: '0',
    //        Quente: 'false' },
    //    Trailer: [ { '$': [Object] }, { '$': [Object] } ],
    //        Generos: [ { '$': [Object] } ] }

    return {
        id: movie.$.IdEspetaculo,
        name: movie.$.NmEspetaculo,
        summary: movie.$.ConteudoSinopse,
        genre: movie.$.Genero,
        cast: movie.$.Elenco,
        director: movie.$.Diretoria,
        duration: movie.$.Duracao,
        originalName: (movie.$.NomeOriginal != movie.$.NmEspetaculo && movie.$.NomeOriginal) || null,
        image: movie.$.Figura
    };
}

/**
 * Searches for query in movie's name.
 * @param query
 * @param candidateMovie
 * @returns {boolean}
 */
function movieFilter(query, candidateMovie) {
    var
        doc;

    doc = str.strOrEmpty(candidateMovie.$.NmEspetaculo) + str.strOrEmpty(candidateMovie.$.NomeOriginal);
    doc = str.lower(str.removeWhite(str.removeDiacritics(doc)));

    query = str.lower(str.removeWhite(str.removeDiacritics(query)));

    return doc.indexOf(query) != -1;
}

/**
 * Fetches the complete movie list and returns the entire collection or a subset if a query was specified.
 *
 * @param query a string to match against movies' title
 * @param next function to be called when the movie list is ready
 */
function fetchMovies(query, next) {

    request(URL, function (requestErr, response, body) {

        if (!requestErr && response.statusCode === 200) {

            xml2js(body, function (xmlErr, result) {
                var
                    moviesList,
                    filterByQuery = movieFilter.bind(null, query);

                if (!xmlErr) {
                    moviesList = result.EspetaculosPaiResponse.EspetaculosPaiResult[0].EspetaculoPai;

                    if (moviesList) {

                        if (query) {
                            next(null, moviesList.filter(filterByQuery).map(movie2model));
                        } else {
                            next(null, moviesList.map(movie2model));
                        }
                    } else {
                        console.info('No movies were found.');
                    }
                } else {
                    next(xmlErr);
                }
            });

        } else {
            next(requestErr);
        }
    });
}

function checkIfExactlyMatch(movies, next) {
    var
        chosenMovie;

    if (movies.length == 1) {

        chosenMovie = movies[0];
        console.info(chosenMovie.name);
        next(null, chosenMovie);
    } else {

        console.info('More than one movie was found matching your query:');
        movies.forEach(function (movie) {
            console.info('\t%s %s', movie.name, movie.originalName ? '(' + movie.originalName + ')' : '');
        });
        console.info('Please narrow your search.');
        next(true);
    }
}

function checkIfDateQueryIsValid(dateQuery, movie, next) {

    // TODO should always get available dates and THEN check date query against the options

    if (dateQuery) {
        next(null, movie, dateQuery);
    } else {
        fetchAvailableDates(movie, function (err, availableDates) {
            if (err) {
                next(err);
            } else {
                console.info('Available dates:');
                availableDates.forEach(function (date) {
                    console.info('\t%s', date);
                });
                if (availableDates.length == 1) {
                    next(null, movie, availableDates[0]);
                } else {
                    next('Please choose one of the dates above to continue.');
                }
            }
        });
    }
}

module.exports = function (movieQuery, dateQuery, theaterQuery, sessionQuery, cb) {

    async.waterfall([
        // list movies and filter by movie query
        fetchMovies.bind(null, movieQuery),
        // if there's only one movie, proceed; otherwise, show available movies and exit
        checkIfExactlyMatch,
        // if there's a date query or if there's only one date available, proceed; otherwise, show available dates and exit
        checkIfDateQueryIsValid.bind(null, dateQuery),
        // list sessions and select one if query matches; otherwise, list available sessions and exit
        fetchSessions.bind(null, theaterQuery, sessionQuery),
        // display seat map for selected session
        fetchSeatMap
    ], cb);
};
