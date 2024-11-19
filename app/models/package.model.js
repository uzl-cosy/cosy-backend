/**
 * Creates and exports a Mongoose model for a package.
 *
 * @param {Object} mongoose - The Mongoose object.
 * @return {Model} The Mongoose model for a package.
 */
module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: mongoose.Types.ObjectId,
    },
  });

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Package = mongoose.model("package", schema);
  return Package;
};
