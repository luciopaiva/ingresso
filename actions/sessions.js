
"use strict";

var
    request = require('request'),
    async = require('async'),
    xml2js = require('xml2js').parseString,
    url = require('../utils/url'),
    str = require('../utils/string'),
    config = require('../config');


function session2model(session) {
    //{ '$':
    //    { IdSessao: '33863770',
    //        IdSetor: '00004440',
    //        LugarMarcado: 'true',
    //        IdTipoSessao: '00000001',
    //        TipoSessao: 'Normal ',
    //        IdTpLegenda: '15',
    //        NmTpLegenda: 'Dublado',
    //        SessaoAtiva: 'S',
    //        Esgotado: 'N',
    //        DataCompleta: '20150418 18:30:00',
    //        Exibe: '',
    //        Origem: 'S',
    //        Remota: 'S',
    //        LayoutPlanta: 'http://storage.ingresso.com',
    //        LayoutPlantaHTML: '' },
    //    DtSessao: [ '20150418' ],
    //    Horario: [ '18:30' ],
    //    Setores: [ {
    //        Setor: [ { '$':
    //            { IdSetor: '00004440',
    //              NmSetor: 'Cinema',
    //              LugarMarcado: 'true',
    //              DtModificada: '06/12/2012 00:00:00',
    //              Ordem: '1',
    //              DataAtualizacao: '2012-12-18T10:34:37.62',
    //              HoraAtualizacao: '2012-12-18T10:34:37.62',
    //              DataEntrada: '2012-12-18T10:34:37.62',
    //              HoraEntrada: '2012-12-18T10:34:37.62',
    //              Ativo: 'true',
    //              Capacidade: '0',
    //              TipoPDV: 'A',
    //              ValorServicoInternet: '0',
    //              ValorServicoTelefone: '0' }
    //        } ] ] }

    return {
        id: session.$.IdSessao,
        soldOut: session.$.Esgotado === 'S',
        date: session.DtSessao[0],
        time: session.Horario[0],
        isOriginalSound: str.lower(str.removeDiacritics(str.strOrEmpty(session.$.NmTpLegenda))).indexOf('dublado') == -1
    };
}

function event2model(event) {
    //{ '$':
    //    { IdEvento: '02371755',
    //        HoraSessao: 'S',
    //        Total: '1',
    //        DiaSemHorario: '',
    //        Obs: '',
    //        EventoVende: 'A',
    //        Fraude: 'N',
    //        IdEspetaculo: '00037967',
    //        CdFilme: '',
    //        NmEspetaculo: 'Chappie (Legendado)',
    //        IdEspetaculoPai: '9413',
    //        NmEspetaculoPai: 'Chappie',
    //        idLocal: '00003075',
    //        NmLocal: 'Sala 2',
    //        idEmpresa: '00000004',
    //        idGrupo: '00001062',
    //        NmGrupo: 'UCI ParkShopping Campo Grande ',
    //        NumGrupoReal: '',
    //        NmBairro: 'Campo Grande',
    //        IdCidade: '00000002',
    //        Figura: 'http://storage.ingresso.com/img/cinema/cartaz/9413_d_Iphone.jpg',
    //        FiguraHorizontal: 'http://storage.ingresso.com/img/cinema/cartaz/9413_d.jpg',
    //        TpDispositivo: '0',
    //        GrupoOnline: 'true',
    //        IdLocalReal: '0' },
    //    Sessao:
    //        [ { '$': [Object],
    //            DtSessao: [Object],
    //            Horario: [Object],
    //            Setores: [Object] } ] }

    var
        theaterName = event.$.NmGrupo + ' - ' + event.$.NmLocal,
        theaterCanonicalName = str.removeWhite(str.lower(str.removeDiacritics(theaterName)));

    return {
        id: event.$.IdEvento,
        movieId: event.$.IdEspetaculoPai,
        theaterName: theaterName,
        theaterCanonicalName: theaterCanonicalName,
        sessions: event.Sessao.map(session2model)
    };
}

function fetchEvents(movie, dateQuery, next) {
    var
        address = url.compose(config.host.base, config.host.sessions.url, config.host.sessions.params, {
            'movieId': movie.id,
            'date': dateQuery
        });

    request(address, function (requestErr, response, body) {

        if (!requestErr && response.statusCode === 200) {

            xml2js(body, function (xmlErr, result) {

                if (!xmlErr) {
                    next(null, result.EventosResponse.EventosResult[0].ProgramacaoEventos.map(event2model));
                } else {
                    next(xmlErr);
                }
            });

        } else {
            if (requestErr) {
                next(requestErr);
            } else {
                next(response.statusCode);
            }
        }
    });
}

function filterTheater(theaterQuery, events, next) {
    var
        query;

    if (theaterQuery) {

        query = str.removeWhite(str.lower(str.removeDiacritics(theaterQuery)));

        events = events.filter(function (event) {
            var
                doc = str.removeWhite(str.lower(str.removeDiacritics(str.strOrEmpty(event.theaterName))));

            return doc.indexOf(query) != -1;
        });
    }

    if (events.length == 0) {

        next('No theaters are screening this movie for the given query.');

    } else if (events.length > 1) {

        console.info('Available theaters:');
        events.forEach(function (event) {
            console.info('\t%s (#%s)', event.theaterName, event.id);
            printSessions(event.sessions);
        });
        next('Please select a theater to continue.');
    } else {

        next(null, events[0]);
    }
}

function printSessions(sessions) {
    var
        sessionsStr = [];

    sessions.forEach(function (session) {
        var
            originalSound = !session.isOriginalSound ? ' (dub)' : '';
        sessionsStr.push(session.time + originalSound);
    });

    console.info('\t\t%s', sessionsStr.join(', '));
}

function filterSessions(sessionQuery, event, next) {
    var
        session,
        sessions = event.sessions;

    console.info('\t%s', event.theaterName);

    if (sessions.length == 0) {
        console.info('No sessions available for the given query. Broaden your search and try again.');
    } else if (sessions.length > 1) {

        printSessions(event.sessions);

        if (sessionQuery) {
            sessionQuery = str.onlyNumbers(sessionQuery);

            sessions = sessions.filter(function (session) {
                return str.onlyNumbers(session.time).indexOf(sessionQuery) != -1;
            });
        }

        if (sessions.length == 1) {
            session = sessions[0];
            console.info('Selected session at %s (#%s)', session.time, session.id);
            next(null, session);
        } else {
            next('Please choose a theater and a session to continue.');
        }

    } else {
        session = sessions[0];
        console.info('\t\tSelected session at %s (#%s)', session.time, session.id);
        next(null, session);
    }
}

module.exports = function (theaterQuery, sessionQuery, movie, dateQuery, cb) {

    // TODO this waterfall should merge into movies.js' waterfall
    async.waterfall([
        fetchEvents.bind(null, movie, dateQuery),
        filterTheater.bind(null, theaterQuery),
        filterSessions.bind(null, sessionQuery)
    ], cb);
};
