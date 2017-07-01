"use strict";

const
    chalk = require('chalk'),
    Session = require('../sessions/session');


class EventPlace {

    constructor (theaterName, neighborhood, roomName, eventName) {
        this.theaterName = theaterName;
        this.neighborhood = neighborhood;
        this.roomName = roomName;
        this.eventName = eventName;
        /** @type {Session[]} */
        this.sessions = [];
    }

    toString() {
        let result = `${chalk.yellow(this.roomName)}`;
        result += chalk.gray(': ') + this.sessions.map(session => session.toString()).join(chalk.gray(', '));
        return result;
    }

    toSearchableString() {
        return this.theaterName + this.roomName;
    }

    static fromXml(xmlNode) {
        const eventPlace = new EventPlace(xmlNode.$['NmGrupo'], xmlNode.$['NmBairro'], xmlNode.$['NmLocal'],
            xmlNode.$['NmEspetaculo']);
        const rawSessions = xmlNode['sessao'];
        if (Array.isArray(rawSessions)) {
            eventPlace.sessions = rawSessions.map(rawSession => Session.fromXml(rawSession));
        }
        return eventPlace;
    }
}

EventPlace.XML_TAG_NAME = 'programacaoeventos';

module.exports = EventPlace;
