
var
    config = require('../config');

var
    URL = config.host.base + config.host.movies.url + '?' + Object.keys(config.host.movies.params).map(function (k) { return k + '=' + config.host.movies.params[k]; }).join('&');

module.exports = function () {

    console.info(URL);

    //request(URL, function (error, response, body) {
    //    if (!error && response.statusCode === 200) {
    //
    //        xml2js(body, function (err, result) {
    //            if (!err) {
    //                console.dir(result.EspetaculosPaiResponse.EspetaculosPaiResult[0].EspetaculoPai);
    //            } else {
    //                console.error('Deu pau no XML');
    //            }
    //        });
    //
    //    } else {
    //        console.error('Deu pau');
    //    }
    //});

};
