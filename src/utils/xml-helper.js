"use strict";

const
    util = require('util'),
    request = require('request'),
    xml2js = require('xml2js');

const
    XML2JS_OPTIONS = {
        normalizeTags: true,
        explicitArray: true,
        explicitRoot: false
    };

/**
 *
 * @param {Object} node
 * @param {String} query
 * @param {Array} result
 */
function queryNodesByTagName(node, query, result) {
    for (const tagName of Object.keys(node)) {
        if (tagName === '$') {
            continue;  // skip attributes list
        }

        const nodesArrayOrInnerText = node[tagName];  // array of elements with same tag name or node's inner text

        if (!Array.isArray(nodesArrayOrInnerText)) {
            continue;  // we've reached some node's inner text
        }

        for (const childNode of nodesArrayOrInnerText) {
            if (tagName === query) {
                result.push(childNode);
            }
            queryNodesByTagName(childNode, query, result);
        }
    }

    return result;
}


class XmlHelper {

    constructor (xml) {
        this.xmlRoot = xml;
    }

    /**
     * Traverses the whole XML document and collect all tags exactly named `tagName`.
     * @param {string} tagName - exact tag name to match
     * @returns {Array} array of objects collected
     */
    queryByTagName(tagName) {
        // console.dir(this.xmlRoot);
        return queryNodesByTagName(this.xmlRoot, tagName, []);
    }

    /**
     * @param {string} url - url to fetch
     * @returns {Promise<XmlHelper>}
     */
    static request(url) {
        return new Promise((resolve, reject) => {
            request(url, async (err, response, body) => {
                if (!err && response.statusCode === 200) {
                    try {
                        resolve(await XmlHelper.parse(body));
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(err, response);
                }
            })
        });
    }

    /**
     *
     * @param {string} body - string to be parsed as XML
     * @returns {Promise<XmlHelper>}
     */
    static parse(body) {
        return new Promise((resolve, reject) => {
            xml2js.parseString(body, XML2JS_OPTIONS,
                (xmlErr, result) => xmlErr ? reject(xmlErr) : resolve(new XmlHelper(result))
            );
        });
    }
}

module.exports = XmlHelper;
