
"use strict";

var
    removeDiacritics = require('diacritics').remove;


function strOrEmpty(str) {
    return str || '';
}

function removeWhite(str) {
    return str.replace(/[\s\n\t]+/, '');
}

function lower(str) {
    return str.toLowerCase();
}

function remDiacritics(str) {
    return removeDiacritics(str);
}

function onlyNumbers(str) {
    return str.replace(/\D/g, '');
}

module.exports = {
    strOrEmpty: strOrEmpty,
    removeWhite: removeWhite,
    lower: lower,
    removeDiacritics: remDiacritics,
    onlyNumbers: onlyNumbers
};
