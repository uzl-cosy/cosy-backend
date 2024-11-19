const { JWT_SECRET } = require("../config");
const db = require("../models");
const User = db.users;
var jwt = require("jsonwebtoken");
const logger = require("../logger");

// Create and Save a new User
exports.create = (req, res) => {
  // Validate request
  // if (!req.body.name) {
  //   res.status(400).send({ message: "Content can not be empty!" });
  //   return;
  // }

  const { username, password } = req.body;

  logger.info(`Creating user "${username}"`);

  // Create a User
  const user = new User({
    username,
    password,
  });
  // Save User in the database
  user
    .save()
    .then((data) => {
      res.send(data);
      // console.log(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the user.",
      });
    });
};
// Retrieve all Users from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title
    ? { title: { $regex: new RegExp(title), $options: "i" } }
    : {};

  User.find(condition)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving Users.",
      });
    });
};
// Find a single User with an id
exports.findOne = (req, res) => {
  const { id } = req.params;

  User.findById(id)
    .then((data) => {
      if (!data) res.status(404).send({ message: "Not found User " + id });
      else res.send(data);
    })
    .catch((err) => {
      res.status(500).send({ message: "Error retrieving User " + id });
    });
};

// Find a single User with an id
exports.login = async (req, res) => {
  const { username, password } = req.body;

  logger.info(
    `logging in user "${username}" with password "${"*".repeat(
      password.length
    )}"`
  );

  const user = await User.findOne({ username })
    .exec()
    .catch((err) => {
      logger.warn(`Could not find user ${username}`);
      res.status(404).send({ message: "Error retrieving User " + username });
    });

  if (user) {
    if (user.password !== password) {
      logger.warn(`Invalid credentials for user ${username}`);
      return res.status(401).send({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { username, userid: user._id.toString() },
      JWT_SECRET,
      {
        expiresIn: "12h",
      }
    );
    const id = user._id.toString();

    return res.status(200).send({ username, token, id });
  }

  return res.status(404).send({ message: "Not found User " + username });
};

// Update a User by the id in the request
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const id = req.params.id;

  User.findByIdAndUpdate(id, req.body, {
    new: true,
    useFindAndModify: false,
  })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update User with id=${id}. Maybe User was not found!`,
        });
      } else res.send({ message: "User was updated successfully." });
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating User with id=" + id + ", details:  " + err,
      });
    });
};
// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  User.findByIdAndRemove(id)
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete User with id=${id}. Maybe User was not found!`,
        });
      } else {
        res.send({
          message: "User was deleted successfully!",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete User with id=" + id + ", details:  " + err,
      });
    });
};
// Delete all Users from the database.
// eslint-disable-next-line no-undef
exports.deleteAll = (req, res) => {
  User.deleteMany({})
    .then((data) => {
      res.send({
        message: `${data.deletedCount} Users were deleted successfully!`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while removing all Users.",
      });
    });
};
