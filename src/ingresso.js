
const
    chalk = require("chalk"),
    config = require("../config"),
    TtyRadioGroup = require("./utils/tty-radio-group"),
    JsonHelper = require("./utils/json-helper"),
    SeatMap = require("./seatmap");

/**
 * @return {void}
 */
async function main() {
    try {
        /** @type {MovieResult[]} */
        const movies = await JsonHelper.getJson(config.moviesUrl);

        const selectedMovieIndex = await TtyRadioGroup.show("Choose movie:", movies.map(movie => movie.title));

        if (selectedMovieIndex === undefined) {
            console.info("Canceled");
            process.exit(0);
        }

        const selectedMovie = movies[selectedMovieIndex];
        console.info(`Selected movie ${chalk.yellow(selectedMovie.title)}.`);

        /** @type {DateResult[]} */
        const dates = await JsonHelper.getJson(config.datesUrl.replace("<eventId>", selectedMovie.id));

        const selectedDateIndex = await TtyRadioGroup.show("Choose date:", dates.map(date => date.date));

        if (selectedDateIndex === undefined) {
            console.info("Canceled");
            process.exit(0);
        }

        const selectedDate = dates[selectedDateIndex];
        console.info(`Selected date ${chalk.yellow(selectedDate.date)}.`);

        /** @type {SessionsResult[]} */
        const sessionsResult = await JsonHelper.getJson(config.sessionsUrl
            .replace("<eventId>", selectedMovie.id).replace("<date>", selectedDate.date));

        if (sessionsResult.length !== 1) {
            console.info(`Warning! Got ${sessionsResult.length} session results, expected only one.`);
        }

        const theaters = sessionsResult[0].theaters;

        const selectedTheaterIndex = await TtyRadioGroup.show("Choose theater:", theaters
            .map(theater => `${theater.name} ${chalk.gray("(" + theater.neighborhood) + ")"}`));

        if (selectedTheaterIndex === undefined) {
            console.info("Canceled");
            process.exit(0);
        }

        const selectedTheater = theaters[selectedTheaterIndex];
        console.info(`Selected theater ${chalk.yellow(selectedTheater.name)}`);

        // prepare a flat list of sessions available for the selected theater
        const sessions = selectedTheater.rooms
            .map(room => {
                for (const session of room.sessions) {
                    session.room = room;  // append room information
                }
                return room.sessions;
            })
            .reduce((allSessions, thisRoomSessions) => allSessions.concat(thisRoomSessions), []);

        let previousRoomName = "";
        const selectedSessionIndex = await TtyRadioGroup.show("Choose session", sessions
            .map(session => {
                let roomName = session.room.name;
                if (roomName === previousRoomName) {
                    roomName = " ".repeat(previousRoomName.length);
                } else {
                    previousRoomName = roomName;
                }
                return roomName + " " + session.date.hour + " " +
                    chalk.gray("(" + session.types.map(type => type.alias).join(" ") + ")");
            }));

        if (selectedSessionIndex === undefined) {
            console.info("Canceled");
            process.exit(0);
        }

        const selectedSession = sessions[selectedSessionIndex];
        console.info(`Selected session ${chalk.yellow(selectedSession.room.name + " " + selectedSession.date.hour)}`);

        console.info("Fetching seat map... (be patient, sometimes their API takes forever to respond)");

        const seatMapUrl = config.seatsUrl
            .replace("<sessionId>", selectedSession.id).replace("<sectionId>", selectedSession.defaultSector);
        /** @type {SeatsResult} */
        const seatMap = await JsonHelper.getJson(seatMapUrl);

        try {
            SeatMap.draw(seatMap);
        } catch (e) {
            console.error(e);
            console.info(`Malformed seat map (check ${seatMapUrl}).`);
        }
    } catch (error) {
        console.error(error);
    }

    // to deal with the fact that stdin may still have being referenced after TtyRadio
    process.exit(0);
}

main();
