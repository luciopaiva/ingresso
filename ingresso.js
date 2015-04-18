
var
    request = require('request'),
    async = require('async'),
    xml2js = require('xml2js').parseString,
    movies = require('./actions/movies');

var
    URL = 'http://www.ingresso.com.br/iphone/ws/IngressoService.svc/rest2/buscaRapidaEspetaculoPai?TpEvento=00000001&idCidade=00000002&IncluiCidade=S&IdGenero=00000000&flEspetaculo=S&Parceria=&idPdv=00000355&IdPais=1&versaoAppMovel=2.0.5';

function main(action) {

    switch (action) {
        case 'movies':
            movies();
            break;
        default:
            console.error('How to use:\n\tnode ingresso <action>');
    }

}

main.apply(null, process.argv.slice(2));
