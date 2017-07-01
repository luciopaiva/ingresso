"use strict";


class EventDate {

    constructor (event, dateStr) {
        this.event = event;
        this.dateStr = dateStr;
    }

    toString() {
        return this.dateStr;
    }
}

EventDate.XML_TAG_NAME = 'datahora';

module.exports = EventDate;
