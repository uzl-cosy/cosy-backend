/**
 * Creates and returns a Mongoose model for the "code" collection.
 *
 * @param {Object} mongoose - The Mongoose instance.
 * @return {Mongoose.Model} The Mongoose model for the "code" collection.
 */
module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    sessionId: String,
    code: String,
    status: String,
    role: String,
    speakerCode: String,
    speakerId: String,
  });

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Code = mongoose.model("code", schema);
  return Code;
};
