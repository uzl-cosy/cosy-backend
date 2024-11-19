const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { expressjwt } = require("express-jwt");
const { JWT_SECRET } = require("./app/config");
const db = require("./app/models");
const lti = require("ims-lti"); // lti for communication with moodle
require("./app/cronJobs"); // cron jobs

const logger = require("./app/logger");

const app = express();

app.use(cors());

// parse requests of content-type - application/json
app.use(bodyParser.json({ limit: "200mb" }));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  expressjwt({ secret: JWT_SECRET, algorithms: ["HS256"] }).unless({
    path: [
      "/users/login",
      "/personalcodes/login",
      "/personalcodes/authenticate",
      { url: "/personalcodes/initiate", methods: ["GET"] },
      { url: "/analysis", methods: ["PUT"] },
      { url: "/audio", methods: ["POST"] }, // TODO remove
      { url: "/log", methods: ["POST"] }, // TODO remove
    ],
  })
);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to CoSy application." });
});

require("./app/routes/session.routes")(app);
require("./app/routes/feedback.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/code.routes")(app);
require("./app/routes/audio.routes")(app);
require("./app/routes/personalcode.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  // console.log(`Server is running on port ${PORT}.`);
  logger.info(`Server is running on port ${PORT}.`);
});

db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    directConnection: true,
  })
  .then(() => {
    // console.log("Connected to the database!");
    logger.info("Connected to the database!");
  })
  .catch((err) => {
    // console.log("Cannot connect to the database!", err);
    logger.error("Cannot connect to the database!", err);
    process.exit();
  });
