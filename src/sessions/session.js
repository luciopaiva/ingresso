"use strict";

const
    chalk = require('chalk');


function extractSectorId(xmlNode) {
    const sectors = xmlNode['setores'];
    if (Array.isArray(sectors)) {
        const sector = sectors[0]['setor'];
        if (Array.isArray(sector)) {
            return sector[0].$['IdSetor'];
        }
    }
    return null;
}


class Session {

    constructor (sessionId, time, subtitles, kind, soldOut, sectorId) {
        this.sessionId = sessionId;
        this.time = time;
        this.subtitles = subtitles;
        this.kind = kind;
        this.soldOut = soldOut;
        this.sectorId = sectorId;
    }

    toString() {
        const sub = this.subtitles === 'dublado' ? 'DUB' : this.subtitles === 'legendado' ? 'LEG' : this.subtitles;
        const kind = this.kind === 'normal' ? '' : this.kind === '3d' ? ' - 3D' : ' - ' + this.kind;
        const info = chalk.magenta(`(${sub}${kind})`);
        return `${this.time} ${info}`;
    }

    toSearchableString() {
        return this.time;
    }

    static fromXml(xmlNode) {
        const sessionId = xmlNode.$['IdSessao'];
        const isSoldOut = xmlNode.$['Esgotado'].trim().toLowerCase() === 's';
        const time = xmlNode['horario'][0].trim();  // get first `horario` element that appears
        const subtitles = xmlNode.$['NmTpLegenda'].trim().toLowerCase();
        const kind = xmlNode.$['TipoSessao'].trim().toLowerCase();
        const sectorId = extractSectorId(xmlNode);

        return new Session(sessionId, time, subtitles, kind, isSoldOut, sectorId);
    }
}

Session.XML_TAG_NAME = 'sessao';

module.exports = Session;
