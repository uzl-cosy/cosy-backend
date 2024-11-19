require("dotenv").config();

function parseBoolean(value) {
  return value === "true" || value === true || value === "1";
}

module.exports = {
  MONGODB_URL:
    process.env.MONGODB_URL ||
    "mongodb://root:example@127.0.0.1:27017/myDatabase",
  JWT_SECRET: process.env.JWT_SECRET || "supersecret",
  SEED_DB: parseBoolean(process.env.SEED_DB),
  ALLOW_OLD_DATA_REQUESTS: parseBoolean(process.env.ALLOW_OLD_DATA_REQUESTS),
  DELETE_DATA_AT_MIDNIGHT: parseBoolean(process.env.DELETE_DATA_AT_MIDNIGHT),
};
