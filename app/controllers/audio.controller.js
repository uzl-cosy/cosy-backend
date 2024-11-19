const path = require("path");
const fs = require("fs");

const db = require("../models");

const logger = require("../logger");

// Create and Save a new User (not used)
exports.create = (req, res) => {
  /* TODO
    Überprüfe, ob Dateiname (feedbackId) dem aktuellen User zugeordnet ist
  */

  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ message: "User uploaded successfully" }));
};

// Find a single User with an id
exports.findOne = (req, res) => {
  /* TODO
    Überprüfe, ob feedbackId dem aktuellen User zugeordnet ist
  */

  const feedbackId = req.params.feedbackId;

  // find all files in given directory that start with the feedbackId
  const directoryPath = path.join(__dirname, "../../uploads/audio");
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      // return console.log("Unable to scan directory: " + err);
      logger.error("Unable to scan directory: " + err);
      return res.status(500).send("Unable to scan directory: " + err);
    }

    const audioFiles = files.filter((file) => file.startsWith(feedbackId));
    if (audioFiles.length === 0) {
      return res.status(404).send("File not found");
    }

    audioFiles.sort();

    // Set the appropriate headers for WAV file
    res.setHeader("Content-Type", "audio/wav");

    // Send the file
    res.sendFile(path.join(directoryPath, audioFiles[audioFiles.length - 1]));

    // Delete other files if more than one exists
    for (let i = 0; i < audioFiles.length - 1; i++) {
      fs.unlink(path.join(directoryPath, audioFiles[i]), (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  });
};
