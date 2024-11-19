/**
 * Initializes routes for handling sessions.
 *
 * @param {Object} app - The express application object.
 */
/**
 * Initializes routes for handling sessions.
 *
 * @param {Object} app - The express application object.
 */
module.exports = (app) => {
  const sessions = require("../controllers/session.controller.js");

  var router = require("express").Router();

  // Create a new Session
  router.post("/", sessions.create);

  // Retrieve all Sessions
  router.get("/", sessions.findAll);

  // Retrieve all published Sessions
  router.get("/published", sessions.findAllPublished);

  // Retrieve a single Session with id
  router.get("/:id", sessions.findOne);

  // Update a Session with id
  router.put("/:id", sessions.update);

  // Delete a Session with id
  router.delete("/:id", sessions.delete);

  // Delete all Sessions
  router.delete("/", sessions.deleteAll);

  app.use("/sessions", router);
};
