/**
 * Initializes routes for handling different CRUD operations on codes.
 *
 * @param {object} app - The express application instance
 * @return {void}
 */
module.exports = (app) => {
  const codes = require("../controllers/code.controller.js");

  var router = require("express").Router();

  // Create a new Code
  router.post("/", codes.create);

  // Register with code
  router.post("/register/:code", codes.register);

  // Checkout with code
  router.post("/checkout/:code", codes.checkout);

  // Retrieve all codes
  router.get("/", codes.findAll);

  // Retrieve a single Code
  router.get("/:code", codes.findOne);

  // Update a Code with id
  router.put("/:id", codes.update);

  // Delete a Session with id
  router.delete("/:id", codes.delete);

  // Delete all codes
  router.delete("/", codes.deleteAll);

  app.use("/codes", router);
};
