/**
 * Creates and returns a Mongoose model for the "personalcode" collection.
 *
 * @param {Object} mongoose - The Mongoose instance.
 * @return {Mongoose.Model} The Mongoose model for the "personalcode" collection.
 */
module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    code: String,
    selectedChoices: String,
  });

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const PersonalCode = mongoose.model("personalcode", schema);
  return PersonalCode;
};
