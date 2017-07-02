"use strict";

const
    chalk = require('chalk');


class Seat {

    constructor (id, row, column, status, kind, subkind) {
        this.id = id;
        this.row = parseInt(row, 10) - 1;
        this.column = parseInt(column, 10) - 1;
        this.status = status;
        this.kind = kind;
        this.subkind = subkind;
        this.symbol = this.decideSymbol();
    }

    toString() {
        return [this.id, this.row, this.column, this.status, this.kind, this.subkind].join(', ');
    }

    /**
     * @param {Object} xmlNode
     * @return {Seat}
     */
    static fromXml(xmlNode) {
        const {IdLugar, Linha, Coluna, Status, Tipo, SubTipo} = xmlNode['$'];
        return new Seat(IdLugar, Linha, Coluna, Status, Tipo, SubTipo);
    }

    decideSymbol() {
        switch (this.kind) {
            case 'C':
            case 'D':
                return this.applyStatus(this.decideSymbolForActualSeat());
            case 'P':
                return Seat.TILE_STAGE;
            case 'L':
                return chalk.blue(this.id);
            default:
        }
    }

    decideSymbolForActualSeat() {
        if ((typeof this.subkind === 'string') && this.subkind.length > 0) {
            switch (this.subkind[0]) {
                case 'N':
                    return this.status === 'L' ? '▣' : '▢';  // regular
                case 'T':
                    return '\u2665';  // lift up armrest
                case 'O':
                    return 'B';  // obese
                case 'D':
                    return '\u267F';  // disabilities
                case 'X':
                    return 'R';
                case 'H':
                    return 'H';  // companion of person with disabilities
            }
            return this.subkind[0];
        } else {
            return 'D';
        }
    }

    applyStatus(symbol) {
        switch (this.status) {
            case 'L':  // available
                return chalk.green(symbol);
            case 'B':  // unavailable
                return chalk.gray(symbol);
            case 'O':  // obstructed
                return chalk.red(symbol);
            default:  // unknown
                return chalk.yellow(this.status);
        }
    }
}

Seat.TILE_STAGE = chalk.gray('▓');
Seat.TILE_FLOOR = chalk.gray(' ');
Seat.TILE_BORDER = chalk.gray('░');

module.exports = Seat;
