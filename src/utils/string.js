
"use strict";

const
    removeDiacritics = require('diacritics').remove;


function strOrEmpty(str) {
    return str || '';
}

function removeWhite(str) {
    return str.replace(/[\s\n\t]+/g, '');
}

function lower(str) {
    return str.toLowerCase();
}

function onlyNumbers(str) {
    return str.replace(/\D/g, '');
}

function enclose(open, str, close) {
    if (!str && !close) {
        str = open;
        open = '(';
        close = ')';
    }
    return str ? open + str + close : '';
}

/**
 * Will try to "loosely" match `needle` by inserting wildcards between each char. This means that, for instance, 'foo'
 * will match against 'bfaoro'. The search is also case-insensitive and ignores diacritics, i.e., it will match "ã" when
 * looking for "a" (and vice-versa).
 *
 * @param {string} haystack - where to look for
 * @param {string} needle - what to look for
 * @param {Function?} callbackForChar - optional function to be called for each character that matched - only param is
 *                                      the character itself; returning value will be used to compose result
 * @param {Function?} callbackForResult - optional function to be called when the result is ready
 * @return {boolean} whether needle was found
 */
function looseMatch(haystack, needle, callbackForChar, callbackForResult) {
    const originalHaystack = haystack;
    haystack = removeDiacritics(haystack.toLowerCase());
    needle = removeDiacritics(needle.toLowerCase());
    let result = '';
    let needlePos = 0;
    let haystackPos = 0;
    while (haystackPos < haystack.length && needlePos < needle.length) {
        if (haystack[haystackPos] === needle[needlePos]) {
            if (callbackForChar) {
                result += callbackForChar(originalHaystack[haystackPos]);
            }
            needlePos++;
        } else {
            result += originalHaystack[haystackPos];
        }

        haystackPos++;
    }
    if (callbackForResult) {
        if (haystackPos !== originalHaystack.length) {
            result += originalHaystack.substr(haystackPos);
        }
        callbackForResult(result);
    }
    return needlePos === needle.length;
}

module.exports = {
    strOrEmpty,
    removeWhite,
    lower,
    removeDiacritics,
    onlyNumbers,
    enclose,
    looseMatch
};
