"use strict";

var
    request = require('request'),
    async = require('async'),
    xml2js = require('xml2js').parseString,
    fetchSessions = require('./sessions'),
    fetchMovieDates = require('./dates'),
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

    var
        name = movie.$.NmEspetaculo,
        originalName = (movie.$.NomeOriginal != movie.$.NmEspetaculo && movie.$.NomeOriginal) || '',
        canonicalName = str.removeWhite(str.lower(str.removeDiacritics(name + originalName)));

    return {
        id: movie.$.IdEspetaculo,
        name: name,
        canonicalName: canonicalName,
        summary: movie.$.ConteudoSinopse,
        genre: movie.$.Genero,
        cast: movie.$.Elenco,
        director: movie.$.Diretoria,
        duration: movie.$.Duracao,
        originalName: originalName || null,
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

    query = str.lower(str.removeWhite(str.removeDiacritics(query)));

    return candidateMovie.canonicalName.indexOf(query) != -1;
}

/**
 * Fetches the complete movie list and returns the entire collection.
 *
 * @param next function to be called when the movie list is ready
 */
function fetchMovies(next) {

    request(URL, function (requestErr, response, body) {

        if (!requestErr && response.statusCode === 200) {

            xml2js(body, function (xmlErr, result) {
                var
                    moviesList;

                if (!xmlErr) {
                    moviesList = result.EspetaculosPaiResponse.EspetaculosPaiResult[0].EspetaculoPai;

                    if (moviesList) {
                        next(null, moviesList.map(movie2model));
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

function checkIfMovieQueryMatches(query, movies, next) {
    var
        chosenMovie;

    if (query) {
        movies = movies.filter(movieFilter.bind(null, query));
    }

    if (movies.length == 1) {

        chosenMovie = movies[0];
        console.info('%s %s', chosenMovie.name, str.enclose(chosenMovie.originalName));
        next(null, chosenMovie);
    } else {

        console.info('More than one movie was found matching your query:');
        movies.sort(function (a, b) {
            return (a.canonicalName < b.canonicalName) ? -1 : 1;
        });
        movies.forEach(function (movie) {
            console.info('\t%s %s', movie.name, str.enclose(movie.originalName));
        });
        console.info('Please narrow your search.');
        next(true);
    }
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

module.exports = function (movieQuery, dateQuery, theaterQuery, sessionQuery, cb) {

    async.waterfall([
        // list movies
        fetchMovies,
        // filter movies and if there's only one movie, proceed; otherwise, show available movies and exit
        checkIfMovieQueryMatches.bind(null, movieQuery),
        // list available dates for the selected movie
        fetchMovieDates,
        // if there's a date query or if there's only one date available, proceed; otherwise, show available dates and exit
        checkIfDateQueryMatches.bind(null, dateQuery),
        // list sessions and select one if query matches; otherwise, list available sessions and exit
        fetchSessions.bind(null, theaterQuery, sessionQuery),
        // display seat map for selected session
        fetchSeatMap
    ], cb);
};
