
"use strict";

function compose(host, path, params) {

    params = Object.keys(params).map(function (k) { return k + '=' + params[k]; });
    return host + path + '?' + params.join('&');
}

module.exports = {
    compose: compose
};
