const winston = require("winston");
const dateFns = require("date-fns");

const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: "debug",
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), myFormat)}),
    new winston.transports.File({ filename: `logs/` + dateFns.format(Date.now(), "yyyyMMddHHmmss") + ".txt", format: winston.format.combine(winston.format.timestamp(), myFormat) }),
  ]
});

module.exports = logger;