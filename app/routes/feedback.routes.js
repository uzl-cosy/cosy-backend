const { expressjwt } = require("express-jwt");
const { JWT_SECRET } = require("../config/index.js");

/**
 * Sets up routes for handling different CRUD operations related to Feedbacks.
 *
 * @param {Object} app - The Express application object.
 */
module.exports = (app) => {
  const feedbacks = require("../controllers/feedback.controller.js");

  var router = require("express").Router();

  // Create a new Feedback
  router.post("/", feedbacks.create);

  // Retrieve all Feedbacks
  router.get("/", feedbacks.findAll);

  // Retrieve all published Feedbacks
  router.get("/published", feedbacks.findAllPublished);

  // Retrieve a single Feedback with id
  router.get("/:id", feedbacks.findOne);

  // Retrieve a single Feedback with id
  router.get("/dataCheck/:id", feedbacks.findOneDataCheck);

  // Retrieve a single transcript with id
  router.get("/transcript/:id", feedbacks.findOneTranscript);

  // Retrieve a single feedback data unit with id
  router.get("/data/:id", feedbacks.findOneFeedback);

  // Update a Feedback with id
  router.put("/", feedbacks.update);

  // Delete a Feedback with id
  router.delete("/:id", feedbacks.delete);

  // Delete all Feedbacks
  router.delete("/", feedbacks.deleteAll);

  app.use("/analysis", router);
};
