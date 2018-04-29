
const
    chalk = require("chalk"),
    config = require("../config"),
    TtyRadioGroup = require("./utils/tty-radio-group"),
    JsonHelper = require("./utils/json-helper"),
    SeatMap = require("./seatmap");

class Ingresso {

    static async selectMovie() {
        let selectedMovie = null;

        /** @type {MovieResult[]} */
        const movies = await JsonHelper.getJson(config.moviesUrl);

        if (!Array.isArray(movies)) {
            console.error("Something went wrong fetching movies.");
            process.exit(1);
        } else if (movies.length === 0) {
            console.info("No movies available.");
            process.exit(0);
        } else if (movies.length === 1) {
            console.info("Only one movie available - will be automatically selected.");
            selectedMovie = movies[0];
        } else {
            const selectedMovieIndex = await TtyRadioGroup.show("Choose movie:", movies.map(movie => movie.title));

            if (selectedMovieIndex === undefined) {
                console.info("Canceled");
                process.exit(0);
            }

            selectedMovie = movies[selectedMovieIndex];
        }

        console.info(`Selected movie ${chalk.yellow(selectedMovie.title)}.`);
        return selectedMovie;
    }

    static async selectDate(selectedMovie) {
        let selectedDate = null;

        /** @type {DateResult[]} */
        const dates = await JsonHelper.getJson(config.datesUrl.replace("<eventId>", selectedMovie.id));

        if (!Array.isArray(dates)) {
            console.error("Something went wrong fetching movie dates.");
            process.exit(1);
        } else if (dates.length === 0) {
            console.info("No dates available.");
            process.exit(0);
        } else if (dates.length === 1) {
            console.info("Only one date available - will be automatically selected.");
            selectedDate = dates[0];
        } else {
            const selectedDateIndex = await TtyRadioGroup.show("Choose date:", dates.map(date => date.date));

            if (selectedDateIndex === undefined) {
                console.info("Canceled");
                process.exit(0);
            }

            selectedDate = dates[selectedDateIndex];
        }

        console.info(`Selected date ${chalk.yellow(selectedDate.date)}.`);
        return selectedDate;
    }

    static async selectTheater(selectedMovie, selectedDate) {
        let selectedTheater = null;

        /** @type {SessionsResult[]} */
        const sessionsResult = await JsonHelper.getJson(config.sessionsUrl
            .replace("<eventId>", selectedMovie.id).replace("<date>", selectedDate.date));

        if (!Array.isArray(sessionsResult)) {
            console.error("Something went wrong fetching movie theaters (unknown result format).");
            process.exit(1);
        } else if (sessionsResult.length === 0) {
            console.info("No theaters available.");
            process.exit(0);
        } else if (sessionsResult.length !== 1) {
            console.info(`Warning! Got ${sessionsResult.length} session results, expected only one.`);
        }

        const theaters = sessionsResult[0].theaters;

        if (!Array.isArray(theaters)) {
            console.error("Something went wrong fetching movie theaters (missing theater list).");
            process.exit(1);
        } else if (theaters.length === 1) {
            console.info("Only one theater available - will be automatically selected.");
            selectedTheater = theaters[0];
        } else {
            const selectedTheaterIndex = await TtyRadioGroup.show("Choose theater:", theaters
                .map(theater => `${theater.name} ${chalk.gray("(" + theater.neighborhood + ")")}`));

            if (selectedTheaterIndex === undefined) {
                console.info("Canceled");
                process.exit(0);
            }

            selectedTheater = theaters[selectedTheaterIndex];
        }

        console.info(`Selected theater ${chalk.yellow(selectedTheater.name)}`);
        return selectedTheater;
    }

    static async selectSession(selectedTheater) {
        let selectedSession = null;

        // prepare a flat list of sessions available for the selected theater
        const sessions = selectedTheater.rooms
            .map(room => {
                for (const session of room.sessions) {
                    session.room = room;  // append room information
                }
                return room.sessions;
            })
            .reduce((allSessions, thisRoomSessions) => allSessions.concat(thisRoomSessions), []);

        if (sessions.length === 0) {
            console.info("No sessions available.");
            process.exit(0);
        } else if (sessions.length === 1) {
            console.info("Only one session available - will be automatically selected.");
            selectedSession = sessions[0];
        } else {
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

            selectedSession = sessions[selectedSessionIndex];
        }

        console.info(`Selected session ${chalk.yellow(selectedSession.room.name + " " + selectedSession.date.hour)}`);
        return selectedSession;
    }

    static async drawSeatMap(selectedSession) {
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
    }

    /**
     * @return {void}
     */
    static async run() {
        try {
            const selectedMovie = await Ingresso.selectMovie();
            const selectedDate = await Ingresso.selectDate(selectedMovie);
            const selectedTheater = await Ingresso.selectTheater(selectedMovie, selectedDate);
            const selectedSession = await Ingresso.selectSession(selectedTheater);
            await Ingresso.drawSeatMap(selectedSession);
        } catch (error) {
            console.error(error);
        }

        // to deal with the fact that stdin may still have being referenced after TtyRadio
        process.exit(0);
    }
}

if (require.main === module) {
    Ingresso.run();
}
