const db = require("../models");
const Session = db.sessions;
const Code = db.codes;
const logger = require("../logger");

// Create and Save a new Session
exports.create = async (req, res) => {
  // Validate request
  // if (!req.body.name) {
  //   res.status(400).send({ message: "Content can not be empty!" });
  //   return;
  // }

  logger.info(`Creating session "${req.body.name}"`);

  const newCode1 = await generateCode(5);
  const newCode2 = await generateCode(5);

  // Create a Session
  const session = new Session({
    title: req.body.name,
    id: req.body.session_id,
    type: req.body.type,
    date: req.body.date,
    room_selected: req.body.roomConfig.roomSelected,
    status: req.body.status,

    meta: {
      recorded_cases: req.body.meta.recorded_cases
        ? req.body.meta.recorded_cases
        : "",
      user_ids: req.body.meta.user_ids ? req.body.meta.user_ids : "",
    },

    baseConfig: {
      application_domain: req.body.baseConfig.application_domain,
      subject_name: req.body.baseConfig.subject_name,
      subject_topic: req.body.baseConfig.subject_topic,
      event_topic: req.body.baseConfig.event_topic,
    },

    roomConfig: {
      room_size: req.body.roomConfig.room_size,
      room_echo: req.body.roomConfig.room_echo,
      rooms: req.body.roomConfig.rooms,
      room_selected: req.body.roomConfig.room_selected,
    },

    caseConfig: {
      cases: req.body.caseConfig.cases,
      case_selected: req.body.caseConfig.case_selected,
    },

    speakerConfig: {
      speaker1: {
        registration_code1: newCode1,

        speaker1_code: "",
        speaker1_name: "",
        speaker1_role: "",
        speaker1_color: "",
        speaker1_id: "",
      },
      speaker2: {
        registration_code2: newCode2,

        speaker2_code: "",
        speaker2_name: "",
        speaker2_role: "",
        speaker2_color: "",
        speaker2_id: "",
      },
      roles: req.body.speakerConfig.roles,
    },
  });

  // Save Session in the database
  session
    .save(session)
    .then((data) => {
      const code1Promise = Code.create({
        code: newCode1,
        sessionId: data._id.toString(),
        role: "role1",
        speakerCode: null,
        status: "open",
        speakerId: "1",
      });

      const code2Promise = Code.create({
        code: newCode2,
        sessionId: data._id.toString(),
        role: "role2",
        speakerCode: null,
        status: "open",
        speakerId: "2",
      });

      // Wait for both promises to resolve using Promise.all
      return Promise.all([code1Promise, code2Promise]).then((codes) => {
        // codes is an array containing the results of both Code.create calls

        // Respond with the session data
        res.send(data);
      });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Session.",
      });
    });
};

// Retrieve all Sessions from the database.
exports.findAll = (req, res) => {
  const user = req.auth.userid;
  // console.log(user);
  logger.info(`Looking for sessions of user ${user}`);
  Session.find({ "meta.user_ids": { $elemMatch: { $eq: user } } })
    .then((data) => {
      res.send(data);
      // console.log(req.auth.userid);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Sessions.",
      });
    });
};

// Find a single Session with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.info(`Looking for session with id ${id}`);

  Session.findById(id)
    .then((data) => {
      if (!data)
        res.status(404).send({ message: "Not found Session with id " + id });
      else res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving Session with id=" + id });
    });
};

// Update a Session by the id in the request
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const id = req.params.id;

  Session.findByIdAndUpdate(id, req.body, {
    new: true,
    useFindAndModify: false,
  })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Session with id=${id}. Maybe Session was not found!`,
        });
      } else res.send({ message: "Session was updated successfully." });
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Session with id=" + id,
      });
    });
};

// Delete a Session with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  logger.info(`Deleting session with id ${id}`);
  Session.findByIdAndRemove(id)
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete Session with id=${id}. Maybe Session was not found!`,
        });
      } else {
        res.send({
          message: "Session was deleted successfully!",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Session with id=" + id,
      });
    });
};

// Delete all Sessions from the database.
exports.deleteAll = (req, res) => {
  Session.deleteMany({})
    .then((data) => {
      res.send({
        message: `${data.deletedCount} Sessions were deleted successfully!`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all Sessions.",
      });
    });
};

// Find all published Sessions
exports.findAllPublished = (req, res) => {
  Session.find({ published: true })
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

/**
 * Generates a random code of the specified length.
 *
 * @param {number} length - The length of the code to generate.
 * @return {Promise<string>} A promise that resolves to the randomly generated code.
 */
async function generateCode(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter++;
  }

  return result;
}
