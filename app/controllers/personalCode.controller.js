const { JWT_SECRET } = require("../config");
const db = require("../models");
const PersonalCode = db.personalCodes;
var jwt = require("jsonwebtoken");

// Create and Save a new PersonalCode
exports.create = async (req, res) => {
  console.log("create", req.query);
  let code = req.query.personalCode;
  // Validate request
  const alreadyExists = await PersonalCode.findOne({ code });
  console.log("is", alreadyExists);
  if (alreadyExists) {
    // Case: Code is duplicate
    console.log("is duplicate");
    const token = jwt.sign(
      { code, userid: alreadyExists._id.toString() },
      JWT_SECRET,
      {
        expiresIn: "12h",
      }
    );
    const id = alreadyExists._id.toString();

    return res.status(200).send({ code, token, id });
  }

  // Case: Code is not existent yet
  const personalCode = req.query.personalCode;
  console.log(`creating user with id code "${personalCode}"`);

  const selectedChoices = req.query.selectedChoices;

  // Create a PersonalCode
  const user = new PersonalCode({
    code: personalCode,
    selectedChoices: selectedChoices,
  });

  // Save PersonalCode in the database
  user
    .save()
    .then((data) => {
      let code = data.code;

      const token = jwt.sign(
        { code, userid: user._id.toString() },
        JWT_SECRET,
        {
          expiresIn: "12h",
        }
      );
      const id = user._id.toString();
      return res.status(200).send({ code, token, id });

      // return res.redirect("/?personalCode=" + code + "&token=" + token);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the user.",
      });
      console.log(err);
    });
};
// Retrieve all PersonalCodes from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title
    ? { title: { $regex: new RegExp(title), $options: "i" } }
    : {};

  PersonalCode.find(condition)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving PersonalCodes.",
      });
    });
};
// Find a single PersonalCode with an id
exports.findOne = (req, res) => {
  console.log("FINDONE: ", req.params);
  const { code } = req.params;

  PersonalCode.findById(code)
    .then((data) => {
      console.log("DATA: ", data);
      if (!data)
        res.status(404).send({ message: "Not found PersonalCode " + code });
      else res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving PersonalCode " + code });
    });
};

// Find a single PersonalCode with an id
exports.login = async (req, res) => {
  const { code } = req.body;

  console.log(`logging in user with id code "${code}"`);

  const user = await PersonalCode.findOne({ code })
    .exec()
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving PersonalCode " + code });
    });

  if (user) {
    const token = jwt.sign({ code, userid: user._id.toString() }, JWT_SECRET, {
      expiresIn: "12h",
    });
    const id = user._id.toString();

    return res.status(200).send({ code, token, id });
  } else {
    console.log("Personal code not found in database!");
    return res.status(404).send({ message: "Not found PersonalCode " + code });
  }
};

// Update a PersonalCode by the id in the request
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const id = req.params.id;

  PersonalCode.findByIdAndUpdate(id, req.body, {
    new: true,
    useFindAndModify: false,
  })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update PersonalCode with id=${id}. Maybe PersonalCode was not found!`,
        });
      } else res.send({ message: "PersonalCode was updated successfully." });
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating PersonalCode with id=" + id,
      });
    });
};

// Delete a PersonalCode with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  PersonalCode.findByIdAndRemove(id)
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete PersonalCode with id=${id}. Maybe PersonalCode was not found!`,
        });
      } else {
        res.send({
          message: "PersonalCode was deleted successfully!",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete PersonalCode with id=" + id,
      });
    });
};
// Delete all PersonalCodes from the database.
exports.deleteAll = (req, res) => {
  PersonalCode.deleteMany({})
    .then((data) => {
      res.send({
        message: `${data.deletedCount} PersonalCodes were deleted successfully!`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while removing all PersonalCodes.",
      });
    });
};
