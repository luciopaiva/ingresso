
module.exports = {
    moviesUrl:   "https://api-content.ingresso.com/v0/events/city/2",  // ToDo allow changing city (2 === Rio)
    datesUrl:    "https://api-content.ingresso.com/v0/sessions/city/2/event/<eventId>/dates",
    sessionsUrl: "https://api-content.ingresso.com/v0/sessions/city/2/event/<eventId>?date=<date>",
    seatsUrl:    "https://api.ingresso.com/v1/sessions/<sessionId>/sections/<sectionId>/seats",
};
