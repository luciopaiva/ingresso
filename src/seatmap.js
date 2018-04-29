
const
    fs = require("fs"),
    chalk = require("chalk");

const
    LINE_MARGIN = " ",
    TILE_FLOOR = " ",
    TILE_STAGE = "▒",
    TILE_BORDER = chalk.gray("░");

class SeatType {
    constructor (name, symbol, description) {
        this.name = name;
        this.symbol = symbol;
        this.description = description;
    }
}

/** @type {Map<String, SeatType>} */
const SEAT_TYPES = new Map();
const registerSeatType = (name, symbol, description) => SEAT_TYPES.set(name, new SeatType(name, symbol, description));
registerSeatType("Regular", "❎", "Regular");
registerSeatType("Couple", "\u2665", "Couple");
registerSeatType("CoupleLeft", "♀", "Couple left chair");
registerSeatType("CoupleRight", "♂", "Couple right chair");
registerSeatType("MotionSimulator", "M", "Motion simulator");
registerSeatType("Disability", "\u267F", "Person with disability");
registerSeatType("ReducedMobility", "\u267F", "Person with reduced mobility");
registerSeatType("Obese", "↔", "Obese person");
registerSeatType("Companion", "C", "Companion");
registerSeatType("RecliningChair", "R", "Reclining chair");

class SeatMap {

    /**
     * @param {SeatsResult} seatMap
     */
    static draw(seatMap) {
        // construct seat map matrix
        /** @type {String[][]} */
        const seatMatrix = Array.from(Array(seatMap.bounds.lines),
            () => Array.from(Array(seatMap.bounds.columns), () => TILE_FLOOR));

        // write stage
        const [y0, y1] = [seatMap.stage.upperLeft.line, seatMap.stage.lowerRight.line];
        const [x0, x1] = [seatMap.stage.upperLeft.column, seatMap.stage.lowerRight.column];
        // sanity check to make sure that the stage is in bounds (do not try to draw otherwise)
        if (x1 < seatMap.bounds.columns && y1 < seatMap.bounds.lines) {
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    seatMatrix[y][x] = TILE_STAGE;
                }
            }

            const stageTitle = "STAGE";
            const stageTitleLeft = Math.round((x0 + x1) / 2 - stageTitle.length / 2);
            const stageTitleTop = y0;
            let stateTitleX = stageTitleLeft;
            for (const char of stageTitle) {
                seatMatrix[stageTitleTop][stateTitleX++] = char;
            }
        }

        // write labels
        for (const label of seatMap.labels) {
            seatMatrix[label.line][label.column] = chalk.blue(label.label);
        }

        /** @type {Set<String>} */
        const seatTypesSeen = new Set();

        // write seats
        for (const line of seatMap.lines) {
            for (const seat of line.seats) {
                if (seat.type === "None") {  // this type appeared once in a Via Parque theater... let's ignore it
                    continue;
                }

                seatTypesSeen.add(seat.type);
                const seatType = SEAT_TYPES.get(seat.type);
                let symbol = seatType ? seatType.symbol : "?";

                switch (seat.status) {
                    case "Available": symbol = chalk.green(symbol); break;
                    case "Occupied": symbol = chalk.red(symbol); break;
                    default: symbol = chalk.gray(symbol); break;
                }
                seatMatrix[seat.line][seat.column] = symbol;
            }
        }

        // draw seat map
        let lines = [];
        for (const line of seatMatrix) {
            let resultingLine = "";
            for (let x = 0; x < line.length; x++) {
                if (line[x] === TILE_STAGE && line[x+1] === TILE_STAGE) {  // glue together pieces of stage
                    resultingLine += line[x].repeat(2);
                } else if (line[x+1]) {  // if there's another column after this, pad with floor
                    resultingLine += line[x] + TILE_FLOOR;
                } else {  // this is the last column; no need to pad
                    resultingLine += line[x];
                }
            }
            lines.push(TILE_BORDER + LINE_MARGIN + resultingLine + LINE_MARGIN + TILE_BORDER);
        }

        const horizontalBorder = TILE_BORDER.repeat(seatMatrix[0].length * 2 - 1 + 2 /* margin */ + 2 /* border */);
        lines.unshift(horizontalBorder);
        lines.push(horizontalBorder);

        console.info("");
        lines.forEach(line => console.info("  " + line));
        console.info("");
        console.info("Legend:");
        for (const seatTypeName of seatTypesSeen) {
            const seatType = SEAT_TYPES.get(seatTypeName);
            if (seatType) {
                console.info(`  ${seatType.symbol} - ${seatType.description}`);
            } else {
                console.info(`  unknown seat type "${seatTypeName}" found`);
            }
        }
    }
}

module.exports = SeatMap;

if (require.main === module) {
    // for debugging purposes
    SeatMap.draw((JSON.parse(fs.readFileSync("../sample-jsons/seatmap.json"))));
}
