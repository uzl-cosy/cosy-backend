/**
 * Sets up routes for personalCodes within the Express app.
 *
 * @param {Object} app - The Express app instance
 * @return {void}
 */
module.exports = (app) => {
  const personalCodes = require("../controllers/personalCode.controller.js");

  var router = require("express").Router();

  // Create a new personalCodes
  router.get("/authenticate", personalCodes.create);

  // Login personalCode
  router.post("/login", personalCodes.login);

  // Retrieve all personalCodes
  router.get("/", personalCodes.findAll);

  // Retrieve a single Session with id
  router.get("/:id", personalCodes.findOne);

  // Update a personalCodes with id
  router.put("/:id", personalCodes.update);

  // Delete a personalCodes with id
  router.delete("/:id", personalCodes.delete);

  // Delete all personalCodes
  router.delete("/", personalCodes.deleteAll);

  app.use("/personalcodes", router);
};
