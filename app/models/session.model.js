/**
 * Creates a new session schema with various configuration options including meta data, base configuration, room configuration, case configuration, speaker configuration, and audio configuration.
 *
 * @param {Object} mongoose - The mongoose object for creating the schema.
 * @return {Object} The Session model created based on the schema.
 */
module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    id: String,
    type: String,
    date: String,
    room_selected: String,
    status: String,

    meta: {
      recorded_cases: Array,
      user_ids: Array,
    },

    baseConfig: {
      application_domain: String,
      subject_name: String,
      subject_topic: String,
      event_topic: String,
    },

    roomConfig: {
      room_size: String,
      room_echo: String,
      rooms: [],
      room_selected: String,
    },

    caseConfig: {
      cases: [],
      case_selected: {
        case_id: String,
        case_name: String,
        case_description: String,
        case_notes: String,
        case_requisites: String,
        case_wordsToSay: Array,
        case_wordsNotToSay: Array,
      },
    },

    // feedback_enabledStudi: String,
    // feedback_enabledActor: String,

    // dataprotectionConfig: String,
    speakerConfig: {
      speaker1: {
        registration_code1: String,
        speaker1_name: String,
        speaker1_role: String,
        speaker1_color: String,
        speaker1_id: String,
        speaker1_code: String,
      },
      speaker2: {
        registration_code2: String,

        speaker2_name: String,
        speaker2_role: String,
        speaker2_color: String,
        speaker2_id: String,
        speaker2_code: String,
      },

      roles: [],
    },
    audioConfig: {
      micro1_id: String,
      micro1_name: String,
      micro1_brand: String,
      micro1_color: String,
      micro2_id: String,
      micro2_name: String,
      micro2_brand: String,
      micro2_color: String,
      microphones: [],
    },
  });

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Session = mongoose.model("session", schema);
  return Session;
};
