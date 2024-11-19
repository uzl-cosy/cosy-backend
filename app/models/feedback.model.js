/**
 * Creates a feedback schema using the provided mongoose object.
 *
 * @param {Object} mongoose - The mongoose object for schema creation.
 * @return {Model} The Feedback model created from the schema.
 */
module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    id: String,
    user_ids: [String],
    meta: {
      session_id: String,
      edit_date: String,
      case_id: String,
      speakers: Array,
      recordData: {
        application_domain: String,
        subject_name: String,
        subject_topic: String,
        event_topic: String,
      },
    },
    transcript: {
      length_time: String,
      length_sec: String,
      transcriptId: String,
    },
    minTimestamp: Number,
    measuresId: String,
    wordsToSay: Array,
    wordsNotToSay: Array,
    dataCheck: Boolean,
    case: Object,
  });

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Feedback = mongoose.model("feedback", schema);
  return Feedback;
};
