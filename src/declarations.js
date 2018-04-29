// JSDoc declarations so the IDE can give us a hand with auto-completion and type checking

/**
 * @typedef {Object} SessionDateResult
 * @property {String} localDate
 * @property {Boolean} isToday
 * @property {String} dayAndMonth
 * @property {String} hour
 * @property {String} year
 */

/**
 * @typedef {Object} SessionTypeResult
 * @property {Number} id
 * @property {String} name
 * @property {String} alias
 */

/**
 * @typedef {Object} SessionResult
 * @property {String} id
 * @property {SessionTypeResult[]} types
 * @property {SessionDateResult} date
 * @property {String} time
 * @property {String} defaultSector
 * @property {RoomResult} room - this is being programmatically added by me to help with showing sessions in the app
 */

/**
 * @typedef {Object} RoomResult
 * @property {String} name
 * @property {SessionResult[]} sessions
 */

/**
 * @typedef {Object} TheaterResult
 * @property {String} id
 * @property {String} name
 * @property {String} neighborhood
 * @property {RoomResult[]} rooms
 */

/**
 * @typedef {Object} SessionsResult
 * @property {TheaterResult[]} theaters
 * @property {String} date
 * @property {String} dateFormatted
 * @property {String} dayOfWeek
 * @property {Boolean} isToday
 */

/**
 * @typedef {Object} DateResult
 * @property {String[]} sessionTypes
 * @property {String} date
 * @property {String} dateFormatted
 * @property {String} dayOfWeek
 * @property {Boolean} isToday
 */

/**
 * @typedef {Object} MovieResult
 * @property {String} id
 * @property {String} title
 * @property {String} originalTitle
 */

/**
 * @typedef {Object} SeatMapStage
 * @property {{ line: Number, column: Number }} upperLeft
 * @property {{ line: Number, column: Number }} lowerRight
 */

/**
 * @typedef {Object} SeatMapBounds
 * @property {Number} lines
 * @property {Number} columns
 */

/**
 * @typedef {Object} SeatLabel
 * @property {String} label
 * @property {Number} line
 * @property {Number} column
 */

/**
 * @typedef {Object} Seat
 * @property {String} id
 * @property {Number} line
 * @property {Number} column
 * @property {String} label
 * @property {String} type
 * @property {String} status
 * @property {String} typeDescription
 * @property {Number} areaNumber
 * @property {Number} rowIndex
 */

/**
 * @typedef {Object} SeatLine
 * @property {Number} line
 * @property {Seat[]} seats
 */

/**
 * @typedef {Object} SeatsResult
 * @property {String} id
 * @property {String} created
 * @property {SeatLine[]} lines
 * @property {SeatLabel[]} labels
 * @property {SeatMapBounds} bounds
 * @property {SeatMapStage} stage
 * @property {Number} activeReservations
 */
