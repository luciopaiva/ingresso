"use strict";

const
    assert = require('assert'),
    {looseMatch} = require('../../src/utils/string');


describe('String Utils', () => {

    it('looseMatch', () => {
        assert(looseMatch('foo', 'foo'), 'Should have matched exactly');
        assert(looseMatch('foobar', 'foo'), 'Should have matched at the beginning');
        assert(looseMatch('barfoo', 'foo'), 'Should have matched at the end');
        assert(looseMatch('barfoobar', 'foo'), 'Should have matched in the middle');
        assert(looseMatch('barfoobarfoo', 'foo'), 'Should have matched at least once');

        assert(looseMatch('bfaoro', 'foo'), 'Should have found interspersed query');
        assert(looseMatch('fboaor', 'foo'), 'Should have found interspersed query');

        assert(!looseMatch('bar', 'foo'), 'Should not have found anything');
        assert(!looseMatch('', 'foo'), 'Should not have found anything');
        assert(looseMatch('', ''), 'Should have found empty needle against empty haystack');
        assert(looseMatch('bar', ''), 'Should have found empty needle against non-empty haystack');

        assert(looseMatch('FOO', 'foo'), 'Should have matched case-insensitively');
        assert(looseMatch('foo', 'FOO'), 'Should have matched case-insensitively');
        assert(looseMatch('Foo', 'fOO'), 'Should have matched case-insensitively');

        assert(looseMatch('cidadão', 'cidadao'), 'Should have matched letters with diacritics');
        assert(looseMatch('cidadao', 'cidadão'), 'Should have matched letters with diacritics');

        assert(looseMatch('Cidades Fantasmas', 'cidades'));
    });
});
