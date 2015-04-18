
"use strict";

var
    request = require('request'),
    async = require('async'),
    xml2js = require('xml2js').parseString,
    url = require('../utils/url'),
    config = require('../config');

var
    URL = url.compose(config.host.base, config.host.sessions.url, config.host.sessions.params);

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
        date: session.DtSessao,
        time: session.Horario
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

    return {
        id: event.$.IdEvento,
        movieId: event.$.IdEspetaculoPai,
        where: event.$.NmGrupo + ' - ' + event.$.NmLocal,
        sessions: event.Sessao.map(session2model)
    };
}

module.exports = function (movieId, cb) {

    request(URL, function (requestErr, response, body) {

        if (!requestErr && response.statusCode === 200) {

            xml2js(body, function (xmlErr, result) {

                if (!xmlErr) {
                    cb(null, result.EventosResponse.EventosResult[0].ProgramacaoEventos.map(event2model));
                } else {
                    cb(xmlErr);
                }
            });

        } else {
            cb(requestErr);
        }
    });

};
