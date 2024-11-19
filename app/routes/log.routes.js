const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const multer = require("multer");
const { format } = require("date-fns");

const logUploadDir = path.join(__dirname, `../../uploads/logs`);

fs.mkdirSync(logUploadDir, { recursive: true });

const storage = multer.diskStorage({
  /**
   * Specifies the destination directory for file uploads.
   *
   * @param {Object} req - The request object
   * @param {Object} file - The file being uploaded
   * @param {Function} cb - The callback function
   * @return {void}
   */
  destination: function (req, file, cb) {
    cb(null, logUploadDir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      req.query.deviceId + "-" + format(Date.now(), "yyyyMMddHHmmss") + ".log"
    );
  },
});
const upload = multer({ storage: storage });

/**
 * Creates a new log by handling a POST request to the specified route.
 *
 * @param {Object} app - The Express application object
 * @return {void} 
 */
module.exports = (app) => {
  const log = require("../controllers/log.controller.js");

  var router = require("express").Router();

  // Create a new log
  router.post(
    "/",
    bodyParser.urlencoded({ extended: true }),
    upload.single("file"),
    log.create
  );

  app.use("/log", router);
};
