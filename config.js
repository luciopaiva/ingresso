
"use strict";

module.exports = {
    WANTS_DEBUG_LOG: true,
    host: {
        base: 'http://www.ingresso.com.br/iphone/ws/IngressoService.svc/rest2/',
        movies: {
            url: 'buscaRapidaEspetaculoPai',
            params: {
                TpEvento: '00000001',
                idCidade: '00000002',
                IncluiCidade: 'S',
                IdGenero: '00000000',
                flEspetaculo: 'S',
                Parceria: '',
                idPdv: '00000355',
                IdPais: '1',
                versaoAppMovel: '2.4.3'
            }
        },
        dates: {
            url: 'ListarDatasHorariosBuscaRapidaPgmacao',
            params: {
                TpEvento: '00000001',
                TipoHorarioOuData: 'Data',
                idPai: '<eventId>',
                Pai: 'S',
                idCidade: '00000002',
                idbairro: '',
                Parceria: '',
                IdPais: '1',
                idPdv: '00000355',
                versaoAppMovel: '2.4.3'
            }
        },
        sessions: {
            url: 'EventosBuscaRapido',
            params: {
                TpEvento: '00000001',
                ExibeOffline: 'True',
                Pai: 'S',
                idPai: '<eventId>',
                idCidade: '00000002',
                Data: '<date>',
                Parceria: '',
                idPdv: '00000355',
                IdPais: '1',
                versaoAppMovel: '2.4.3',
                idBairro: ''
            }
        },
        seatmap: {
            url: 'ListarPlanta',
            params: {
                IdSessao: '<sessionId>',
                idSetor: '<sectorId>',
                idPdv: '00000355',
                IdPais: '1',
                versaoAppMovel: '2.4.3'
            }
        }
    }
};
