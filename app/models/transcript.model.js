/**
 * Creates a Mongoose model for the "transcript" collection.
 *
 * @param {Object} mongoose - The Mongoose instance.
 * @return {Mongoose.Model} The Mongoose model for the "transcript" collection.
 */
module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    speakers: Array,
    feedbackId: String,
    minTimestamp: { type: Number, default: 0 },
    maxTimestamp: { type: Number, default: 0 },
    transcripts: [
      {
        speakerId: String,
        content: [
          {
            timeStart: Number,
            timeEnd: Number,
            value: String,
            confidences: [Number],
          },
        ],
      },
    ],
  });

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Transcript = mongoose.model("transcript", schema);
  return Transcript;
};
