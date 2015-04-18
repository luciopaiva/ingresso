
"use strict";

var
    request = require('request'),
    async = require('async'),
    xml2js = require('xml2js').parseString,
    url = require('../utils/url'),
    config = require('../config');

var
    URL = url.compose(config.host.base, config.host.movies.url, config.host.movies.params);

function movie2model(movie) {
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
        originalName: movie.$.NomeOriginal,
        image: movie.$.Figura
    };
}

module.exports = function (cb) {

    request(URL, function (requestErr, response, body) {

        if (!requestErr && response.statusCode === 200) {

            xml2js(body, function (xmlErr, result) {

                if (!xmlErr) {
                    cb(null, result.EspetaculosPaiResponse.EspetaculosPaiResult[0].EspetaculoPai.map(movie2model));
                } else {
                    cb(xmlErr);
                }
            });

        } else {
            cb(requestErr);
        }
    });

};
