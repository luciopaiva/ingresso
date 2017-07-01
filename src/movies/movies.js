"use strict";

const
    chalk = require('chalk'),
    XmlHelper = require('../utils/xml-helper'),
    logger = require('../utils/logger'),
    composeUrl = require('../utils/compose-url'),
    {looseMatch} = require('../utils/string'),
    config = require('../../config'),
    Movie = require('./movie');


/**
 * @param {Movie[]} movies
 */
function dumpMovieList(movies) {
    for (const movie of movies) {
        logger.info(chalk.yellow('↪ ') + movie.toString(true));
    }
}

/**
 *
 * @param {Movie[]} movies - list of movies to run query against
 * @param {string} query - the query to run. Will "loosely" match the query by inserting wildcards between each char.
 *                         This means that, for instance, 'foo' will match against 'bfaoro'.
 * @return {Movie[]}
 */
function filterMovieList(movies, query) {
    return movies.filter(movie => looseMatch(movie.toString(), query));
}

class Movies {

    /**
     * @param {string} movieQuery - any sequential combination of part of the movie title with part of the movie id
     * @return {Movie} selected movie, if there was only one match; otherwise, null
     */
    static async search(movieQuery) {
        const url = composeUrl(config.host.base, config.host.movies.url, config.host.movies.params);
        logger.debug(`Fetching available movies... ('${url}')`);
        const xmlResponse = await XmlHelper.request(url);

        const allMovies = xmlResponse.queryByTagName(Movie.XML_TAG_NAME)
            .map(rawMovie => rawMovie.$)  // pluck attributes
            .map($ => new Movie($['IdEspetaculo'], $['NmEspetaculo']));

        if (!movieQuery) {
            logger.info(`List of movies found (${allMovies.length}):`);
            dumpMovieList(allMovies);
            logger.info('\nNow choose a movie.');
        } else {
            const filteredMovies = filterMovieList(allMovies, movieQuery);
            if (filteredMovies.length > 1) {
                logger.info(`List of movies that matched (${filteredMovies.length} of ${allMovies.length}):`);
                dumpMovieList(filteredMovies);
                logger.info('Trying narrowing down your search.');
            } else {
                const movie = filteredMovies[0];
                logger.info('Selected movie: ' + chalk.green(movie.toString(true)));
                return movie;
            }
        }

        return null;
    }
}

module.exports = Movies;
