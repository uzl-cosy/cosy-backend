const mongoose = require("mongoose");
const { MONGODB_URL } = require("../config/index.js");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = MONGODB_URL;
db.sessions = require("./session.model.js")(mongoose);
db.feedbacks = require("./feedback.model.js")(mongoose);
db.users = require("./user.model.js")(mongoose);
db.codes = require("./code.model.js")(mongoose);
db.packages = require("./package.model.js")(mongoose);
db.measurements = require("./measure.model.js")(mongoose);
db.transcriptions = require("./transcript.model.js")(mongoose);
db.personalCodes = require("./personalCode.model.js")(mongoose);

// console.log(db.url);
module.exports = db;
