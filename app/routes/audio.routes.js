const path = require("path");
const fs = require("fs");
const multer = require("multer");

const audioUploadDir = path.join(__dirname, `../../uploads/audio`);

fs.mkdirSync(audioUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, audioUploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

/**
 * Initializes and configures the audio routes for the application.
 *
 * @param {Object} app - The Express application object.
 * @return {void} This function does not return anything.
 */
module.exports = (app) => {
  const audio = require("../controllers/audio.controller.js");

  const router = require("express").Router();

  // Create a new Session
  router.post("/", upload.single("file"), audio.create);

  // Retrieve a single Session with id
  router.get("/:feedbackId", audio.findOne);

  app.use("/audio", router);
};
