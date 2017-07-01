
"use strict";

function composeUrl(host, path, params, substitutions) {

    params = Object.keys(params).map(function (key) {
        var
            value = params[key],
            groups = value.match(/<(.*)>/);

        if (groups) {
            value = substitutions[groups[1]];
        }

        return key + '=' + value;
    });
    return host + path + '?' + params.join('&');
}

module.exports = composeUrl;
