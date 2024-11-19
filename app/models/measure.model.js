/**
 * Creates a Mongoose schema for the "measure" model.
 *
 * @param {Object} mongoose - The Mongoose object.
 * @return {Object} The Mongoose model for the "measure" schema.
 */
module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    measureId: String,
    type: String,
    timestamps: Array,

    conversationPauses: {
      speakers: [
        {
          speakerId: String,
          //  totalLength: Number, totalCount: Number,
          data: Array,
        },
      ],
    },
    conversationShares: {
      stats: {
        overlaps: { type: Number, default: 0 },
        totalSpokenTime: { type: Number, default: 0 },
      },
      speakers: [
        {
          speakerId: String,
          dataContinous: Array,
          statisticValues: { spokenTime: { type: Number, default: 0 } },
        },
      ],
    },
    pitch: {
      speakers: [
        {
          speakerId: String,
          data: [
            {
              recordTimestamp: Number,
              dataContinous: Array,
              dataGlobal: Array,
            },
          ],
          graphData: Array,
          stats: {
            globalValues: [{ min: String, max: String, mean: String }],
            statisticalValues: [],
          },
        },
      ],
      // dataGlobal: Array,
      // stats: [],
    },
    tempo: {
      speakers: [
        {
          speakerId: String,
          data: [
            {
              recordTimestamp: Number,
              dataContinous: Array,
              dataGlobal: Array,
            },
          ],
          graphData: Array,
          stats: {
            min: String,
            max: String,
            average: String,
          },
        },
      ],
    },
    loudness: {
      speakers: [
        {
          speakerId: String,
          data: [
            {
              recordTimestamp: Number,
              dataContinous: Array,
              dataGlobal: Array,
            },
          ],
          graphData: Array,
          stats: {
            globalValues: [{ min: String, max: String, mean: String }],
            stats: {
              globalValues: [{ min: String, max: String, mean: String }],
              statisticalValues: [],
            },
          },
        },
      ],
      // dataGlobal: Array,
    },
    words: {
      speakers: [
        {
          speakerId: String,
          data: [
            {
              recordTimestamp: Number,
              adjectives: Object,
              nouns: Object,
              verbs: Object,
              questions: Array,
              keywords: Array,
              adjFrequencies: Object,
              nounFrequencies: Object,
              verbFrequencies: Object,
            },
          ],
        },
      ],
    },
  });

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Measure = mongoose.model("measure", schema);
  return Measure;
};
