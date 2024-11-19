const db = require("../models");
const Feedback = db.feedbacks;
const Package = db.packages;
const Transcript = db.transcriptions;
const Measure = db.measurements;
const Session = db.sessions;

const logger = require("../logger");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// function lastTime(i, transcript) {
//   if (i >= 1) {
//     return transcript[i - 1].timeEnd;
//   } else return 0;
// }

// Create and Save a new Feedback Object
exports.create = (req, res) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }
  logger.info("Creating new Feedback object");

  let newTranscriptId = "";
  let newMeasureId = "";

  // Use Promise.all to wait for both setup operations to complete
  Promise.all([
    setUpTranscript(req.body.speakers),
    setUpMeasurement(req.body.speakers),
  ])
    .then(([transcriptId, measurementId]) => {
      logger.info(`Created new Transcript with ID ${transcriptId}`);
      logger.info(`Created new Measurement with ID ${measurementId}`);

      newTranscriptId = transcriptId;
      newMeasureId = measurementId;

      const session = Session.findById(req.body.session_id);
      // Create a Feedback object using the obtained ids
      const feedback = new Feedback({
        user_ids: req.body.user_ids ? req.body.user_ids : "",
        meta: {
          session_id: req.body.session_id ? req.body.session_id : "",
          edit_date: req.body.edit_date ? req.body.edit_date : new Date(),
          case_id: req.body.case_id ? req.body.case_id : "",
          speakers: req.body.speakers ? req.body.speakers : [],
          recordData: {
            application_domain: session
              ? session.baseConfig
                ? session.baseConfig.application_domain
                : ""
              : "",
            subject_name: session
              ? session.baseConfig
                ? session.baseConfig.subject_name
                : ""
              : "",
            subject_topic: session
              ? session.baseConfig
                ? session.baseConfig.subject_topic
                : ""
              : "",
            event_topic: session
              ? session.baseConfig
                ? session.baseConfig.event_topic
                : ""
              : "",
          },
        },
        timestamps: [],
        minTimestamp: null,
        transcript: {
          length_time: "",
          length_sec: "",
          transcriptId: newTranscriptId,
        },
        measuresId: newMeasureId,
        wordsToSay: req.body.wordsToSay,
        wordsNotToSay: req.body.wordsNotToSay,
        dataCheck: false,
        case: req.body.case ? req.body.case : "",
      });

      let feedbackId = "";
      // Save Feedback in the database
      feedback
        .save(feedback)
        .then((data) => {
          console.log("feedbackId: ", data._id.toHexString());
          feedbackId = data._id.toHexString();

          res.json({ feedbackId });
        })
        .catch((err) => {
          res.status(500).json({
            message:
              err.message ||
              "Some error occurred while creating the Feedback or pitch object.",
          });
        });
    })
    .catch((error) => {
      console.error("Error setting up data object:", error);
    });
};
// Retrieve all Feedbacks from the database.
exports.findAll = (req, res) => {
  const user = req.auth.userid;
  console.log(user);
  Feedback.find({ user_ids: { $elemMatch: { $eq: user } } })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Sessions.",
      });
    });
};
// Find a single Feedback with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.info(`Retrieving Feedback with ID ${id}`);

  Feedback.findById(id)
    .then(async (data) => {
      if (!data) {
        logger.warn(`Feedback with ID ${id} not found`);
        res.status(404).send({ message: "Not found Feedback with id " + id });
      } else {
        const audioFile = "";
        res.send({ ...data, audioFile });
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving Feedback with id=" + id });
    });
};

// Find a single Transcript with an id
exports.findOneTranscript = (req, res) => {
  const id = req.params.id;
  logger.info(`Retrieving Transcript with ID ${id}`);
  Transcript.findById(id)
    .then(async (data) => {
      if (!data) {
        res.status(404).send({ message: "Not found Feedback with id " + id });
        return;
      }
      data.transcripts.forEach((transcript) => {
        transcript.content.forEach((chunk) => {
          chunk.timeStart -= data.minTimestamp;
          chunk.timeEnd -= data.minTimestamp;

          chunk.timeStart = Math.round(chunk.timeStart * 10) / 10;
          chunk.timeEnd = Math.round(chunk.timeEnd * 10) / 10;
        });
      });

      const audioFile = "";

      res.send({ ...data, audioFile });
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving Transcript with id=" + id });
    });
};

// Find a single Feedback unit with an id
exports.findOneFeedback = (req, res) => {
  logger.info(`Retrieving Feedback with ID ${req.params.id}`);

  const id = req.params.id;

  Measure.findById(id)
    .then(async (data) => {
      if (!data)
        res.status(404).send({ message: "Not found Feedback with id " + id });
      else {
        const audioFile = "";

        res.send({ ...data });
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving Transcript with id=" + id });
    });
};

// Update a Feedback by the id in the request
exports.update = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }
  const id = req.body.feedbackId;
  logger.info(`Updating Feedback with ID ${id}`);

  try {
    validateRequestBody(req);

    const feedback = await Feedback.findById(req.body.feedbackId);
    if (!feedback) {
      return res
        .status(404)
        .json({ message: `Feedback not found with id ${req.body.feedbackId}` });
    }

    if (req.body.channelNr) {
      if (
        !feedback.minTimestamp ||
        feedback.minTimestamp > req.body.recordTimestamp
      ) {
        feedback.minTimestamp = req.body.recordTimestamp;
      }
      try {
        const transcript = await Transcript.findById(
          feedback.transcript.transcriptId
        );
        if (transcript) {
          let check = false;

          transcript.transcripts.forEach((elem) => {
            if (elem.content.length > 0) {
              check = true;
            }
          });

          feedback.dataCheck = check;
        }
      } catch (error) {
        console.error(error);
      }
      feedback.save();

      //  handle updates in transcripts and feedback measures
      handleTranscriptUpdate(req, res, feedback);
      handleFeedbackUpdate(req, res, feedback);

      return res.status(200).json({
        message: `Feedback with id ${req.body.feedbackId} successfully updated`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//function calculates the speakers conversation share
// input is array with speakers and their content
// data: [{speakerId: String, content: []}]
async function calculateShares(data) {
  // set up the output data
  let output = { speakers: [], stats: [] };

  for (let i = 0; i < data.length; i++) {
    output.speakers.push({
      speakerId: data[i].speakerId,
      sharesContinous: [],
      sharesTotal: 0,
      sentencesLengths: [],
    });
  }
  let totalSpokenTime = 0;
  let overlaps = 0;

  // Iterate over each spoken chunk in the first array
  data[0].content.forEach((chunk1) => {
    // Iterate over each spoken chunk in the second array
    data[1].content.forEach((chunk2) => {
      // Calculate the overlap between the time ranges
      const overlapStart = Math.max(chunk1.timeStart, chunk2.timeStart);
      const overlapEnd = Math.min(chunk1.timeEnd, chunk2.timeEnd);

      // If there's overlap, add the duration to the total time
      if (overlapEnd > overlapStart) {
        overlaps += overlapEnd - overlapStart;
      }
    });
  });

  // iterate through each speaker
  for (let i = 0; i < data.length; i++) {
    let sharesContinous = [];
    let sharesTotal = 0;
    // let sentencesLengths = [];

    // iterate through each speakers spoken chunks
    for (let j = 0; j < data[i].content.length; j++) {
      //sentence length
      let currCount = 0;
      const sentenceEndings = new Set([".", "!", "?"]);

      //add spoken time to speakers total share
      sharesTotal += data[i].content[j].timeEnd - data[i].content[j].timeStart;

      //add spoken time to speakers share (accumulate with previous value)
      if (sharesContinous.length == 0) {
        sharesContinous.push(
          parseFloat(
            data[i].content[j].timeEnd - data[i].content[j].timeStart
          ).toFixed(1)
        );
      } else {
        const sum = parseFloat(
          data[i].content[j].timeEnd -
            data[i].content[j].timeStart +
            sharesContinous[sharesContinous.length - 1]
        ).toFixed(1);

        sharesContinous.push(sum);
      }
    }
    output.speakers[i].sharesTotal = sharesTotal;
    output.speakers[i].sharesContinous = sharesContinous;

    totalSpokenTime += sharesTotal;
    sharesTotal = 0;
    sharesContinous = [];
  }
  output.stats = { totalSpokenTime: totalSpokenTime, overlaps: overlaps };

  return output;
}

// Delete a Feedback with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  logger.info(`Deleting Feedback with ID ${id}`);

  try {
    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res
        .status(404)
        .send({ message: `Feedback with id ${id} not found` });
    }

    // Log related IDs
    const { measuresId, transcript } = feedback;
    console.log("Measures ID:", measuresId);
    console.log("Transcript ID:", transcript?.transcriptId);

    // Delete related Transcript and Measures in parallel
    const deletionPromises = [];

    // If Measures exists, add its deletion to the promises
    if (measuresId) {
      deletionPromises.push(
        Measure.findByIdAndRemove(measuresId).catch((err) => {
          console.error(`Error deleting Measures with id=${measuresId}:`, err);
        })
      );
    }

    // If Transcript exists, add its deletion to the promises
    if (transcript?.transcriptId) {
      deletionPromises.push(
        Transcript.findByIdAndRemove(transcript.transcriptId).catch((err) => {
          console.error(
            `Error deleting Transcript with id=${transcript.transcriptId}:`,
            err
          );
        })
      );
    }

    // Wait for the deletion of Measures and Transcript
    await Promise.all(deletionPromises);

    // Delete the Feedback itself
    const deletedFeedback = await Feedback.findByIdAndRemove(id);
    if (!deletedFeedback) {
      return res
        .status(404)
        .send({ message: `Feedback with id=${id} not found!` });
    }

    // Final success response after all deletions are done
    res.send({
      message: "Feedback and related data were deleted successfully!",
    });
  } catch (err) {
    console.error("Error deleting feedback:", err);
    res.status(500).send({ message: `Error deleting Feedback with id=${id}` });
  }
};

/**
 * Finds a single Feedback by its ID and checks if the associated Transcript has any content.
 *
 * @param {Object} req - The request object containing the ID of the Feedback to find.
 * @param {Object} res - The response object used to send the result of the operation.
 * @return {Promise} A Promise that resolves to an object with a message and a check flag.
 */
exports.findOneDataCheck = (req, res) => {
  const id = req.params.id;
  Feedback.findById(id)
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot find Feedback with id=${id}.`,
        });
      } else {
        let check = false;
        if (data.transcript.transcriptId) {
          Transcript.findById(data.transcript.transcriptId).then(
            async (data) => {
              if (!data)
                res
                  .status(404)
                  .send({ message: "Not found Feedback with id " + id });
              else {
                data.transcripts.forEach((transcript) => {
                  if (transcript.content.length > 0) {
                  }
                });
              }
            }
          );
        }
        res.send({
          message: "Feedback was deleted successfully!",
          check,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not find Feedback with id=" + id,
      });
    });
};
// Delete all Feedbacks from the database.
exports.deleteAll = (req, res) => {
  Feedback.deleteMany({})
    .then((data) => {
      res.send({
        message: `${data.deletedCount} Feedbacks were deleted successfully!`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all Feedbacks.",
      });
    });
};
// Find all published Feedbacks
exports.findAllPublished = (req, res) => {
  Feedback.find({ published: true })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Feedbacks.",
      });
    });
};

// async function handlePackageUpdate(req, res, feedback) {
//   try {
//     if (req.body.packageId) {
//       const packages = await Package.findOne({
//         packageId: new ObjectId(req.body.packageId),
//       })
//         .lean()
//         .exec();

//       // Ensure that packages is not existent
//       if (packages) {
//         res.json({ message: "Package is a duplicate" });
//         return true;
//       } else {
//         const newPackage = new Package({
//           packageId: new ObjectId(req.body.packageId),
//         });
//         try {
//           return true;
//         } catch (error) {
//           console.error(error);
//           res.status(500).json({ message: "Error saving package" });
//           return true;
//         }
//       }
//     } else {
//       return true;
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// }

/**
 * Validates the request body to ensure it is not empty.
 *
 * @param {Object} req - The request object containing the body to validate
 */
function validateRequestBody(req) {
  if (!req.body) {
    throw new Error("Data to update cannot be empty");
  }
}

// function calculates the total and time based shares
function performFeedbackCalculations(updatedMeasure, transcript) {
  //output set up
  let shares = [];
  let timeStamps = [];
  for (let i = 0; i <= transcript.transcripts.length - 1; i++) {
    shares.push({
      id: transcript.transcripts[i].speakerId,
      value: 0,
      valueTime: 0,
    });
  }
  shares.push({
    id: "pause",
    value: 0,
    valueTime: 0,
  });

  for (let i = 0; i <= transcript.transcripts.length - 1; i++) {
    let speakerTranscript = transcript.transcripts[i];
    let timeStampsEach = [];
    let curr_total = 0;

    for (let j = 0; j <= speakerTranscript.content.length - 1; j++) {
      // console.log(speakerTranscript);
      let item = speakerTranscript.content[j];
      // console.log(item);
      timeStampsEach.push({
        start: item.timeStart,
        end: item.timeStart,
      });

      curr_total += item.timeEnd - item.timeStart;
    }
    shares[i].value = curr_total;
  }
  let sum = 0;
  shares.forEach((item) => {
    sum += item.value;
  });
  shares[shares.length - 1].value = sum;

  // console.log(shares);

  let sentenceLengths = { total: 0, lengths: [] };
  let sharesContinous = [];

  // for (var i = 0; i < newTranscript.content.length; i++) {
  // updatedFeedback.transcript.content[i].speakerId =
  //   updatedFeedback.transcript.content[i].speakerId === "1"
  //     ? updatedFeedback.meta.speakers[0].id
  //     : updatedFeedback.meta.speakers[1].id;

  // conversation content element
  // let item = {
  //   speakerId: newTranscript.content[i].speakerId,
  //   timeStart: newTranscript.content[i].timeStart,
  //   timeEnd: newTranscript.content[i].timeEnd,
  //   value: newTranscript.content[i].value,
  // };
  // curr_total += item.timeEnd - item.timeStart;

  // this.$store.state.feedbacks[0].newTranscript.content.push(item);
  // this.$store.state.feedbacks[0].conversationShares;

  // Calculate Pauses
  // if (i >= 1) {
  //   shares[2].value +=
  //     newTranscript.content[i].timeStart -
  //     newTranscript.content[i - 1].timeEnd;
  //   shares[2].valueTime +=
  //     newTranscript.content[i].timeStart -
  //     newTranscript.content[i - 1].timeEnd;
  //   curr_total += item.timeStart - newTranscript.content[i - 1].timeEnd;
  // }

  // Calculate Conversation Shares && sentence length
  // if (item.speakerId == id1) {
  //   // calculate sentence lengths
  //   let currCount = 0;
  //   let finishingSymbols = [".", "!", "?"];
  //   for (let i = 0; i < item.value.length; i++) {
  //     if (
  //       item.value[i] == " " &&
  //       i > 1 &&
  //       !finishingSymbols.includes(item.value[i - 2])
  //     ) {
  //       currCount++;
  //     }
  //     if (
  //       finishingSymbols.includes(item.value[i]) &&
  //       !finishingSymbols.includes(item.value[i - 1])
  //     ) {
  //       sentence_lengths.speaker1.lengths.push(currCount);
  //       currCount = 0;
  //     }
  //   }

  //   //add spoken time to speakers total share
  //   shares[0].value += item.timeEnd - item.timeStart;
  //   shares[0].valueTime += item.timeEnd - item.timeStart;

  //   //add spoken time to speakers share (accumulate with previous value)
  //   if (sharesContinous.speaker1.length == 0) {
  //     sharesContinous.speaker1.push(
  //       parseFloat(item.timeEnd - item.timeStart).toFixed(1)
  //     );
  //     console.log(parseFloat(item.timeEnd - item.timeStart).toFixed(1));
  //   } else {
  //     let sum = parseFloat(
  //       item.timeEnd -
  //         item.timeStart +
  //         sharesContinous.speaker1[sharesContinous.speaker1.length - 1]
  //     ).toFixed(1);
  //     console.log(sum);

  //     sharesContinous.speaker1.push(sum);
  //   }

  //   //add recent value of quite speaker whose share has not changed
  //   if (sharesContinous.speaker2.length == 0) {
  //     sharesContinous.speaker2.push(0);
  //   } else {
  //     let oldValue = parseFloat(
  //       sharesContinous.speaker2[sharesContinous.speaker2.length - 1]
  //     ).toFixed(1);
  //     console.log(oldValue);

  //     sharesContinous.speaker2.push(oldValue);
  //   }
  // } else if (item.speakerId == id2) {
  //   let currCount = 0;
  //   let finishingSymbols = [".", "!", "?"];
  //   for (let i = 0; i < item.value.length; i++) {
  //     if (
  //       item.value[i] == " " &&
  //       i > 1 &&
  //       !finishingSymbols.includes(item.value[i - 2])
  //     ) {
  //       currCount++;
  //     }
  //     if (
  //       finishingSymbols.includes(item.value[i]) &&
  //       !finishingSymbols.includes(item.value[i - 1])
  //     ) {
  //       sentence_lengths.speaker2.lengths.push(currCount);
  //       currCount = 0;
  //     }
  //   }

  //   //add spoken time to speakers total share
  //   shares[1].value += item.timeEnd - item.timeStart;
  //   shares[1].valueTime += item.timeEnd - item.timeStart;

  //   //add spoken time to speakers share
  //   if (sharesContinous.speaker2.length == 0) {
  //     sharesContinous.speaker2.push(
  //       parseFloat(item.timeEnd - item.timeStart).toFixed(1)
  //     );
  //   } else {
  //     let sum = parseFloat(
  //       item.timeEnd -
  //         item.timeStart +
  //         sharesContinous.speaker2[sharesContinous.speaker2.length - 1]
  //     ).toFixed(1);
  //     sharesContinous.speaker2.push(sum);
  //   }

  //   //add recent value of quite speaker whose share has not changed
  //   if (sharesContinous.speaker1.length == 0) {
  //     sharesContinous.speaker1.push(0);
  //   } else {
  //     let oldValue = parseFloat(
  //       sharesContinous.speaker1[sharesContinous.speaker1.length - 1]
  //     ).toFixed(1);
  //     sharesContinous.speaker1.push(oldValue);
  //   }
  // }
  // }

  //Calculate relative shares
  // shares[0].value = Math.round((shares[0].value / curr_total) * 100) / 100;
  // shares[1].value = Math.round((shares[1].value / curr_total) * 100) / 100;
  // shares[2].value = Math.round((shares[2].value / curr_total) * 100) / 100;

  // console.log(shares);
  // const filter = {
  //   _id: id,
  // };

  // const update = {
  //   $set: {
  //     "feedbackData.conversationShares.dataTotal": shares,
  //     "feedbackData.conversationShares.dataContinous": sharesContinous,
  //     timestamps: timeStamps,
  //     transcript: newTranscript,
  //   },
  // };

  // Perform the update using updateOne
  // Feedback.updateOne(filter, update)
  //   .then((result) => {
  //     console.log(result);
  //     if (result.modifiedCount === 1) {
  //       console.log("Document updated successfully.");
  //       // Handle success
  //     } else {
  //       console.log(
  //         "No document matched the criteria, so no update was performed."
  //       );
  //       // Handle when no document matches the criteria
  //     }
  //     res.status(200).json(updatedFeedback);
  //   })
  //   .catch((error) => {
  //     console.error("Error updating document:", error);
  //   });
}

/**
 * Sets up a new transcript with the given speakers and returns the transcript ID.
 *
 * @param {Array<Object>} newSpeakers - An array of objects representing the speakers.
 * @return {Promise<string>} A promise that resolves to the transcript ID.
 */
function setUpTranscript(newSpeakers) {
  return new Promise((resolve, reject) => {
    const transcript = new Transcript({
      speakers: newSpeakers,
      minTimestamp: 0,
      maxTimestamp: 0,
    });

    for (let i = 0; i < newSpeakers.length; i++) {
      const newTranscript = {
        speakerId: newSpeakers[i].id,
        content: [],
        rawData: [],
      };
      transcript.transcripts.push(newTranscript);
    }
    transcript
      .save()
      .then((data) => {
        const transcriptId = data._id.toHexString();
        resolve(transcriptId);
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

/**
 * Sets up a new measurement with the given speakers and returns the measurement ID.
 *
 * @param {Array<Object>} newSpeakers - An array of objects representing the speakers.
 * @return {Promise<string>} A promise that resolves to the measurement ID.
 */
function setUpMeasurement(newSpeakers) {
  return new Promise((resolve, reject) => {
    // measure formats
    const newMeasures1 = [];
    const newMeasures2 = [];
    const newMeasures4 = [];

    const newWords = [];

    //for each speaker push the the respective formats
    for (let i = 0; i < newSpeakers.length; i++) {
      newMeasures1.push({
        speakerId: newSpeakers[i].id,
        data: [],
        graphData: [],
        stats: { globalValues: [], statisticValues: [] },
      });
      newMeasures2.push({
        speakerId: newSpeakers[i].id,
        data: [],
        stats: {
          stats: {
            min: 0,
            max: 0,
            average: 0,
          },
        },
      });

      newMeasures4.push({
        speakerId: newSpeakers[i].id,
        dataContinous: [],
        statisticValues: { spokenTime: 0 },
      });

      newWords.push({
        speakerId: newSpeakers[i].id,
        data: [],
      });
    }

    //create new measurement object to save in the database
    const measure = new Measure({
      "pitch.speakers": newMeasures1,
      "loudness.speakers": newMeasures1,
      "tempo.speakers": newMeasures2,
      "conversationShares.speakers": newMeasures2,
      "conversationShares.stats": newMeasures4,
      "conversationPauses.speakers": newMeasures2,
      "words.speakers": newWords,
    });

    measure
      .save()
      .then((data) => {
        const measureId = data._id.toHexString();
        resolve(measureId);
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

/**
 * Handles the update of a transcript based on the provided feedback.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Object} feedback - The feedback containing the transcript information.
 */
async function handleTranscriptUpdate(req, res, feedback) {
  try {
    const transcript = await Transcript.findById(
      feedback.transcript.transcriptId
    );
    if (transcript) {
      if (req.body.contentTranscript) {
        const updateDoc = transcript.transcripts.find(
          (obj) => obj.speakerId == req.body.channelNr
        );
        if (updateDoc) {
          // updating the transcript
          for (let i = 0; i < req.body.contentTranscript.length; i++) {
            const existent = updateDoc.content.filter((obj) => {
              obj.timeStart ===
                req.body.contentTranscript[i].timeStart +
                  req.body.recordTimestamp;
            });

            if (existent.length > 0) {
              continue;
            }

            const item = {
              value: req.body.contentTranscript[i].value,
              timeStart:
                req.body.contentTranscript[i].timeStart +
                req.body.recordTimestamp,
              timeEnd:
                req.body.contentTranscript[i].timeEnd +
                req.body.recordTimestamp,
            };
            updateDoc.content.push(item);

            updateDoc.content.sort((a, b) => {
              return a.timeStart - b.timeStart;
            });

            if (
              !transcript.minTimestamp ||
              transcript.minTimestamp == 0 ||
              transcript.minTimestamp > req.body.recordTimestamp
            ) {
              transcript.minTimestamp = req.body.recordTimestamp;
            }

            if (
              !transcript.maxTimestamp ||
              transcript.maxTimestamp == 0 ||
              Math.round(
                transcript.maxTimestamp <
                  req.body.contentTranscript[
                    req.body.contentTranscript.length - 1
                  ].timeEnd +
                    req.body.recordTimestamp
              )
            ) {
              transcript.maxTimestamp = Math.round(
                req.body.contentTranscript[
                  req.body.contentTranscript.length - 1
                ].timeEnd + req.body.recordTimestamp
              );
            }
            if (feedback.dataCheck) feedback.dataCheck = true;
          }
          await transcript.save();
        } else {
          return res.status(404).json({
            message: "Speaker not found in the transcript",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error handling transcript update:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Updates the feedback data for a given measure.
 *
 * @param {Object} req - The request object containing the updated feedback data.
 * @param {Object} res - The response object.
 * @param {Object} feedback - The feedback object containing the measuresId.
 * @return {Promise<void>} - A promise that resolves when the feedback data is updated.
 */
async function handleFeedbackUpdate(req, res, feedback) {
  try {
    const measure = await Measure.findById(feedback.measuresId);

    if (!measure) {
      return res.status(404).json({
        message: `Feedback data not found with id ${feedback.measuresId}`,
      });
    }
    if (req.body.contentPitch) {
      // push pitch values per speaker
      const updatePitch = measure.pitch.speakers.find(
        (obj) => obj.speakerId == req.body.channelNr
      );

      // update pitch values per speaker
      if (
        updatePitch &&
        updatePitch.data.filter((obj) => {
          return obj.recordTimestamp == req.body.recordTimestamp;
        }).length == 0
      ) {
        const transcript = await Transcript.findById(
          feedback.transcript.transcriptId
        );
        const myTranscript = transcript.transcripts[req.body.channelNr - 1];

        // compare recordtTimestamp with time boundaries
        if (
          req.body.recordTimestamp < transcript.minTimestamp ||
          req.body.recordTimestamp > transcript.maxTimestamp
        ) {
          logger.info(`No transcript chunk existent for the current data`);
          return;
        }
        const minTimestamp = transcript.minTimestamp;
        const maxTimestamp = transcript.maxTimestamp;

        const duration = Math.round((maxTimestamp - minTimestamp) / 0.25);

        // chunk element
        const newElement = {
          dataContinous: [],
          dataGlobal: [],
          recordTimestamp: req.body.recordTimestamp,
        };

        //logging
        let counter = 0;
        myTranscript.content.forEach((obj) => {
          // console.log(obj);
          counter++;
        });
        // console.log("transcript has", counter, "elements");

        // search for respective transcript chunk
        const transcriptChunks = myTranscript.content.filter((obj) => {
          return (
            obj.timeStart >= req.body.recordTimestamp &&
            obj.timeEnd <= req.body.recordTimestamp + 30
          );
        });

        if (transcriptChunks) {
          if (
            req.body.contentPitch.dataContinous.length ==
            transcriptChunks.length
          ) {
            // write sampled dataChunks in DB
            req.body.contentPitch.dataContinous.forEach((element, i) => {
              let chunkDuration = 0;

              chunkDuration =
                transcriptChunks[i].timeEnd - transcriptChunks[i].timeStart;

              const result = downsample(element, chunkDuration / 0.25);

              newElement.dataContinous.push(result);
            });

            req.body.contentPitch.dataGlobal.forEach((element, i) => {
              newElement.dataGlobal.push(element);
            });
            updatePitch.data.push(newElement);
          }

          updatePitch.graphData = generateGraphData(
            updatePitch,
            myTranscript,
            transcript.maxTimestamp,
            transcript.minTimestamp
          );
        }
      }
    }

    // update loudness values per speaker
    if (req.body.contentLoudness) {
      const updateLoudness = measure.loudness.speakers.find(
        (obj) => obj.speakerId == req.body.channelNr
      );

      if (
        updateLoudness &&
        req.body.contentLoudness &&
        updateLoudness.data.filter((obj) => {
          return obj.recordTimestamp == req.body.recordTimestamp;
        }).length == 0
      ) {
        const transcript = await Transcript.findById(
          feedback.transcript.transcriptId
        );
        const myTranscript = transcript.transcripts[req.body.channelNr - 1];

        // compare recordtTimestamp with time boundaries
        if (
          req.body.recordTimestamp < transcript.minTimestamp ||
          req.body.recordTimestamp > transcript.maxTimestamp
        ) {
          return;
        }
        const minTimestamp = transcript.minTimestamp;
        const maxTimestamp = transcript.maxTimestamp;

        const duration = Math.round((maxTimestamp - minTimestamp) / 0.25);

        // chunk element
        let newElement = {
          dataContinous: [],
          dataGlobal: [],
          recordTimestamp: req.body.recordTimestamp,
        };

        //logging
        let counter = 0;
        myTranscript.content.forEach((obj) => {
          counter++;
        });

        // search for respective transcript chunk
        let transcriptChunks = myTranscript.content.filter((obj) => {
          return (
            obj.timeStart >= req.body.recordTimestamp &&
            obj.timeEnd <= req.body.recordTimestamp + 30
          );
        });

        if (transcriptChunks) {
          if (
            req.body.contentLoudness.dataContinous.length ==
            transcriptChunks.length
          ) {
            // write sampled dataChunks in DB
            req.body.contentLoudness.dataContinous.forEach((element, i) => {
              let chunkDuration = 0;

              chunkDuration =
                transcriptChunks[i].timeEnd - transcriptChunks[i].timeStart;

              const result = downsample(element, chunkDuration / 0.25);

              newElement.dataContinous.push(result);
            });

            req.body.contentLoudness.dataGlobal.forEach((element, i) => {
              newElement.dataGlobal.push(element);
            });

            updateLoudness.data.push(newElement);
          }

          updateLoudness.graphData = generateGraphData(
            updateLoudness,
            myTranscript,
            transcript.maxTimestamp,
            transcript.minTimestamp
          );
        }
      }
    }

    // push tempo values per speaker
    if (req.body.contentTempo) {
      const updateTempo = measure.tempo.speakers.find(
        (obj) => obj.speakerId == req.body.channelNr
      );

      if (
        updateTempo &&
        updateTempo.data.filter((obj) => {
          return obj.recordTimestamp == req.body.recordTimestamp;
        }).length == 0
      ) {
        const transcript = await Transcript.findById(
          feedback.transcript.transcriptId
        );
        const myTranscript = transcript.transcripts[req.body.channelNr - 1];

        // compare recordtTimestamp with time boundaries
        if (
          req.body.recordTimestamp < transcript.minTimestamp ||
          req.body.recordTimestamp > transcript.maxTimestamp
        ) {
          logger.info(`No transcript chunk existent for the current data`);
          return;
        } else {
          let minTimestamp = transcript.minTimestamp;
          let maxTimestamp = transcript.maxTimestamp;

          let duration = Math.round((maxTimestamp - minTimestamp) / 0.25);

          // chunk element
          let newElement = {
            dataContinous: [],
            dataGlobal: [],
            recordTimestamp: req.body.recordTimestamp,
          };

          //logging
          let counter = 0;
          myTranscript.content.forEach((obj) => {
            counter++;
          });
          logger.info(`Transcript has ${counter} elements`);

          // search for respective transcript chunk
          const transcriptChunks = myTranscript.content.filter((obj) => {
            return (
              obj.timeStart >= req.body.recordTimestamp &&
              obj.timeEnd <= req.body.recordTimestamp + 30
            );
          });

          if (transcriptChunks) {
            if (
              req.body.contentTempo.dataContinous.length ==
              transcriptChunks.length
            ) {
              // write sampled dataChunks in DB
              req.body.contentTempo.dataContinous.forEach((element, i) => {
                let chunkDuration = 0;

                chunkDuration =
                  transcriptChunks[i].timeEnd - transcriptChunks[i].timeStart;

                let result = [];
                for (let j = 0; j < element.length; j++) {
                  result.push(Math.round(element[j]));
                }

                if (chunkDuration * 4 < element.length) {
                  result = downsample(element, chunkDuration / 0.25);
                }

                newElement.dataContinous.push(result);
              });

              req.body.contentTempo.dataGlobal.forEach((element, i) => {
                newElement.dataGlobal.push(element);
              });
              updateTempo.data.push(newElement);
            }

            updateTempo.graphData = generateGraphData(
              updateTempo,
              myTranscript,
              transcript.maxTimestamp,
              transcript.minTimestamp
            );
          }
        }
      }
    }

    let updatedTranscript = null;

    // push transcript values per speaker
    if (req.body.contentTranscript) {
      updatedTranscript = await Transcript.findById(
        feedback.transcript.transcriptId
      );

      const transcript = updatedTranscript.transcripts.find(
        (obj) => obj.speakerId == req.body.channelNr
      );

      const shares = await calculateShares(updatedTranscript.transcripts);
      if (!shares) {
        throw new Error("Shares calculation failed");
      }

      // new Data
      const overlapData = Math.round(shares.stats.overlaps * 10) / 10;
      const spokenTimeData = Math.round(shares.stats.totalSpokenTime * 10) / 10;

      measure.conversationShares.stats.overlaps = overlapData;
      measure.conversationShares.stats.totalSpokenTime = spokenTimeData;

      shares.speakers.forEach((speaker) => {
        // Update measures document with new shares data
        let elem = measure.conversationShares.speakers.find(
          (obj) => obj.speakerId == speaker.speakerId
        );
        elem.dataContinous = speaker.sharesContinous;
        elem.statisticValues.spokenTime =
          Math.round(speaker.sharesTotal * 10) / 10;
      });
    }

    // push NLP values per speaker
    if (req.body.contentNLP) {
      const updateWords = measure.words.speakers.find(
        (obj) => obj.speakerId == req.body.channelNr
      );
      const convertObjectToArray = (obj) => {
        return Object.keys(obj).map((key) => ({
          noun: key,
          count: obj[key],
        }));
      };

      updateWords.data.push({
        recordTimestamp: req.body.recordTimestamp,
        adjectives: convertObjectToArray(req.body.contentNLP.adjCounts),
        nouns: convertObjectToArray(req.body.contentNLP.nounCounts),
        verbs: convertObjectToArray(req.body.contentNLP.verbCounts),
        questions: req.body.contentNLP.questions,
        keywords: req.body.contentNLP.keywords,
        adjFrequencies: req.body.contentNLP.adjFrequencies,
        nounFrequencies: req.body.contentNLP.nounFrequencies,
        verbFrequencies: req.body.contentNLP.verbFrequencies,
      });

      updateWords.data.sort((a, b) => {
        return a.recordTimestamp - b.recordTimestamp;
      });
    }

    await measure.save();
  } catch (error) {
    console.error("Error handling transcript update:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Generates graph data based on the given speaker, transcript, maximum, and minimum values.
 *
 * @param {Object} speaker - The speaker object containing data.
 * @param {Object} transcript - The transcript object containing content.
 * @param {number} max - The maximum value.
 * @param {number} min - The minimum value.
 * @return {Array} The generated graph data.
 */
function generateGraphData(speaker, transcript, max, min) {
  const graphData = [];
  const arrayLength = (max - min) / 0.25;

  // //calculate baseArray with nulls
  for (let i = 0; i < arrayLength; i++) {
    graphData.push(null);
  }

  speaker.data.sort((a, b) => {
    return a.recordTimestamp - b.recordTimestamp;
  });

  // write data
  speaker.data.forEach((measureChunk, i) => {
    const matchingSentences = transcript.content.filter((element) => {
      return (
        element.timeStart >= measureChunk.recordTimestamp &&
        element.timeEnd < measureChunk.recordTimestamp + 30
      );
    });

    if (matchingSentences.length == 0) {
      return;
    }

    measureChunk.dataContinous.forEach((dataArray, i) => {
      const startIndex = Math.round(
        (matchingSentences[i].timeStart - min) / 0.25
      );

      const sentenceTime = roundToNearestQuarter(
        matchingSentences[i].timeEnd - matchingSentences[i].timeStart
      );

      // case that there are fewer values than spoken time
      if (sentenceTime * 4 > dataArray.length) {
        const replicationLength = Math.floor(
          (sentenceTime * 4) / dataArray.length
        );
        for (let k = 0; k < dataArray.length; k++) {
          for (let l = 0; l < replicationLength; l++) {
            graphData[startIndex + k + l] = dataArray[k];
          }
        }
        return;
      }
      //write the data as it is
      for (let k = 0; k < dataArray.length; k++) {
        graphData[startIndex + k] = dataArray[k];
      }
    });
  });
  return graphData;
}

async function calculateAverage(array) {
  var total = 0;
  var count = 0;

  array.forEach(function (item, index) {
    // Convert the string to a floating-point number
    var numericValue = parseFloat(item);

    // Check if the conversion was successful (not NaN)
    if (!isNaN(numericValue)) {
      total += numericValue;
      count++;
    }
  });

  return count === 0 ? 0 : total / count;
}

/**
 * Downsamples the given data array to a new size.
 *
 * @param {Array} data - The original data array to downsample.
 * @param {number} newSize - The desired size of the downsampled data array.
 * @return {Array} The downsampled data array of the specified newSize.
 */
function downsample(data, newSize) {
  const originalSize = data.length;
  const ratio = originalSize / newSize;
  const result = [];

  for (let i = 0; i < newSize - 1; i++) {
    const start = Math.round(i * ratio);
    const end = Math.round((i + 1) * ratio);
    let sum = 0;

    for (let j = start; j < end; j++) {
      sum += data[j];
    }

    result.push(Math.round(sum / (end - start)));
  }

  return result;
}

/**
 * Finds the closest multiple of 0.25 to the given number.
 *
 * @param {number} number - The original number to find the closest multiple to.
 * @return {number} The closest multiple of 0.25 to the input number.
 */
function roundToNearestQuarter(number) {
  // Find the closest multiple below the original number
  const below = Math.floor(number / 0.25) * 0.25;

  // Find the closest multiple above the original number
  const above = Math.ceil(number / 0.25) * 0.25;

  // Choose the closest multiple
  return number - below < above - number ? below : above;
}
