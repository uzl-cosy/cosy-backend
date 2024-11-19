const cron = require("node-cron");
const db = require("./models");
const fs = require("fs");
const path = require("path");
const { DELETE_DATA_AT_MIDNIGHT } = require("./config");

const logger = require("./logger");

// Delete all audio files from the uploads/audio directory
function deleteAudioFiles() {
  const directory = path.join(__dirname, "../uploads/audio");
  fs.readdir(directory, (err, files) => {
    if (err) {
      // console.error("Error reading directory:", err);
      logger.error("Error reading directory:", err);
      return;
    }

    files.forEach((file) => {
      const filePath = directory + "/" + file;
      fs.unlink(filePath, (err) => {
        if (err) {
          // console.error("Error deleting file:", err);
          logger.error("Error deleting file:", err);
        } else {
          // console.log("Deleted file:", filePath);
          logger.info("Deleted file:", filePath);
        }
      });
    });
  });
}

// Delete all transcripts from the database
async function deleteTranscripts() {
  logger.info("Deleting transcripts");
  await db.transcriptions.deleteMany({});
}

// Delete all measures from the database
async function deleteMeasures() {
  logger.info("Deleting measures");
  await db.measurements.deleteMany({});
}

// Schedule the cron jobs to run at midnight every day
if (DELETE_DATA_AT_MIDNIGHT) {
  logger.info("Cron jobs running");
  cron.schedule("0 0 * * *", () => {
    deleteAudioFiles();
    deleteTranscripts();
    deleteMeasures();
  });
}
