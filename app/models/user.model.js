const { SEED_DB } = require("../config");
const logger = require("../logger");

/**
 * Creates a new user schema, seeds the user collection if SEED_DB is true, and returns the User model.
 *
 * @param {Object} mongoose - The mongoose object for schema creation.
 * @return {Model} The User model.
 */
module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    username: String,
    password: String,
  });
  const User = mongoose.model("user", schema);

  if (SEED_DB) {
    logger.info("Seeding user collection...");
    const users = [
      {
        username: "cosy",
        password: "cosy",
      },
    ];

    users.forEach(async (user) => {
      if (!(await User.findOne({ username: user.username }))) {
        await User.create(user);
        logger.info(`User ${user.username} created.`);
      }
    });
  }

  return User;
};
