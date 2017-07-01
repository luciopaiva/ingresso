"use strict";

const
    assert = require('assert'),
    fs = require('fs'),
    xml2js = require('xml2js'),
    Movie = require('../../src/movies/movie'),
    EventPlace = require('../../src/events/event-place'),
    XmlHelper = require('../../src/utils/xml-helper');

const
    SESSIONS_XML = fs.readFileSync('./sample-xmls/sessions.xml'),
    MOVIES_XML = fs.readFileSync('./sample-xmls/movies.xml');


describe('XML Query', () => {

    it('should parse movies list', async function () {
        const xml = await XmlHelper.parse(MOVIES_XML);
        assert(xml instanceof XmlHelper);
        assert(xml instanceof Object);

        const nodes = xml.queryByTagName(Movie.XML_TAG_NAME);

        assert(Array.isArray(nodes));
        assert.strictEqual(nodes.length, 65, 'Number of movie nodes found does not match');
    });

    it('should parse sessions list', async function () {
        const xml = await XmlHelper.parse(SESSIONS_XML);
        assert(xml instanceof XmlHelper);
        assert(xml instanceof Object);

        const nodes = xml.queryByTagName(EventPlace.XML_TAG_NAME);
        assert(Array.isArray(nodes));

        // assert.strictEqual(nodes.length, 65, 'Number of movie nodes found does not match');
    });
});
