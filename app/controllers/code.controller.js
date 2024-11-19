const { JWT_SECRET } = require("../config");
const db = require("../models");
const Code = db.codes;
const Session = db.sessions;
const mongoose = require("mongoose");

var jwt = require("jsonwebtoken");

const logger = require("../logger");

/**
 * Create and save a new Code in the database based on the request data.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise} A promise that resolves to the saved data or rejects with an error message.
 */
exports.create = (req, res) => {
  // Validate request
  // if (!req.body.name) {
  //   res.status(400).send({ message: "Content can not be empty!" });
  //   return;
  // }

  // Create a Code
  const newCode = new Code({
    id: req.body.id,
    code: req.body.code,
    role: req.body.role,
    status: req.body.status,
    speakerCode: req.body.speakerCode,
    speakerId: req.body.speakerId,
  });

  // Save Code in the database
  newCode
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the code.",
      });
    });
};

/**
 * Perform user registration based on the provided code.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise} A promise that resolves with a success message or rejects with an error message.
 */
exports.register = async (req, res) => {
  const { code } = req.params;
  const { user } = req.body;

  // Validate the code
  if (!isValidCode(code)) {
    return res.status(400).json({ error: "Invalid code" });
  }

  try {
    // Perform user registration using the code
    const myCode = await Code.findOneAndUpdate(
      { code },
      {
        $set: {
          // update values
          speakerCode: user.id,
          speakerId: user.id,
        },
      }
    );
    const sessionId = myCode.sessionId;

    // Update the session with the user ID
    await Session.findOneAndUpdate(
      {
        _id: sessionId,
        "speakerConfig.speaker1.registration_code1": myCode.code,
      },
      {
        $set: {
          // update values
          "speakerConfig.speaker1.speaker1_id": user.id,
          "speakerConfig.speaker1.speaker1_code": user.id,
        },
      },
      { new: true } // Set to true to return the modified document
    );
    await Session.findOneAndUpdate(
      {
        _id: sessionId,
        "speakerConfig.speaker2.registration_code2": myCode.code,
      },
      {
        $set: {
          // update values
          "speakerConfig.speaker2.speaker2_id": user.id,
          "speakerConfig.speaker2.speaker2_code": user.id,
        },
      },
      { new: true } // Set to true to return the modified document
    );

    // Respond with a success message or user data
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Perform user checkout using the provided code.
 *
 * @param {Object} req - The request object containing the code in the params.
 * @param {Object} res - The response object.
 * @return {Promise} A promise that resolves with a success message or rejects with an error message.
 */
exports.checkout = async (req, res) => {
  const { code } = req.params;
  try {
    // Perform user checkout using the code
    const myCode = await Code.findOneAndUpdate(
      { code },
      {
        $set: {
          // update values
          speakerCode: null,
          speakerId: null,
        },
      }
    );
    const sessionId = myCode.sessionId;

    await Session.findOneAndUpdate(
      {
        _id: sessionId,
        "speakerConfig.speaker1.registration_code1": code,
      },
      {
        $set: {
          // update values
          "speakerConfig.speaker1.speaker1_id": null,
          "speakerConfig.speaker1.speaker1_code": null,
        },
      },
      { new: true } // Set to true to return the modified document
    );
    await Session.findOneAndUpdate(
      {
        _id: sessionId,
        "speakerConfig.speaker2.registration_code2": code,
      },
      {
        $set: {
          // update values
          "speakerConfig.speaker2.speaker2_id": null,
          "speakerConfig.speaker2.speaker2_code": null,
        },
      },
      { new: true } // Set to true to return the modified document
    );

    // Respond with a success message or user data
    res.status(201).json({ message: "User checked out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Function to validate the code
const isValidCode = async (code) => {
  try {
    // Query to check if the code exists
    const codeExists = await Code.findOne({ code });

    // Return true if the code exists, false otherwise
    return codeExists !== null;
  } catch (error) {
    console.error(error);
    return false; // Return false in case of any error
  }
};

/**
 * Retrieve all Codes from the database.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @return {Array} Array of retrieved Codes
 */
exports.findAll = (req, res) => {
  const title = req.query.title;
  const condition = title
    ? { title: { $regex: new RegExp(title), $options: "i" } }
    : {};

  Code.find(condition)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving Codes.",
      });
    });
};
/**
 * Find a single Code with an id.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @return {Promise} A promise that resolves to the found Code or rejects with an error message
 */
exports.findOne = (req, res) => {
  const { id } = req.params;

  Code.findById(id)
    .then((data) => {
      if (!data) res.status(404).send({ message: "Not found Code " + id });
      else res.send(data);
    })
    .catch((err) => {
      res.status(500).send({ message: "Error retrieving Code " + id });
    });
};

/**
 * Logs in a code with the given codename and password.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<Object>} A promise that resolves to the login response.
 */
exports.login = async (req, res) => {
  const { codename, password } = req.body;

  logger.info(
    `logging in code "${codename}" with password "${"*".repeat(
      password.length
    )}"`
  );

  const code = await Code.findOne({ codename })
    .exec()
    .catch((err) => {
      res.status(500).send({ message: "Error retrieving Code " + codename });
    });

  if (code) {
    if (code.password !== password)
      res.status(401).send({ message: "Invalid credentials" });
    const token = jwt.sign(
      { codename, codeid: code._id.toString() },
      JWT_SECRET,
      {
        expiresIn: "12h",
      }
    );
    const id = code._id.toString();

    return res.status(200).send({ codename, token, id });
  }

  return res.status(404).send({ message: "Not found Code " + codename });
};

/**
 * Updates a Code by the id.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise} A promise that resolves to the updated Code.
 */
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const id = req.params.id;

  Code.findByIdAndUpdate(id, req.body, {
    new: true,
    useFindAndModify: false,
  })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Code with id=${id}. Maybe Code was not found!`,
        });
      } else res.send({ message: "Code was updated successfully." });
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Code with id=" + id,
      });
    });
};

/**
 * Delete a Code with the specified id in the request.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise} A promise that resolves to the result of the deletion operation.
 */
exports.delete = (req, res) => {
  const id = req.params.id;

  Code.findByIdAndRemove(id)
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete Code with id=${id}. Maybe Code was not found!`,
        });
      } else {
        res.send({
          message: "Code was deleted successfully!",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Code with id=" + id,
      });
    });
};

/**
 * Deletes all records from the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise} A promise that resolves to the result of the deletion operation.
 */
exports.deleteAll = (req, res) => {
  Code.deleteMany({})
    .then((data) => {
      res.send({
        message: `${data.deletedCount} Codes were deleted successfully!`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while removing all Codes.",
      });
    });
};

/**
 * Generates a random code of the specified length.
 *
 * @param {number} length - The length of the code to generate.
 * @return {string} The randomly generated code.
 */
function generateCode(length) {
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
