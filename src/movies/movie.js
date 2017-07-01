"use strict";

const
    chalk = require('chalk'),
    Event = require('../events/event');


class Movie extends Event {

    constructor(id, name) {
        super(id);
        this.name = name;
    }

    toString(colored = false) {
        let id = `(#${this.id})`;
        if (colored) id = chalk.gray(id);
        return `${this.name} ${id}`;
    }
}

Movie.XML_TAG_NAME = 'espetaculopai';

module.exports = Movie;
