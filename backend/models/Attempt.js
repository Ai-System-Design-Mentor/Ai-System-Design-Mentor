const mongoose = require("mongoose");
// for the diagram scheama
const nodeSchema = new mongoose.Schema(
    // store each component of the diagram with its properties
  { id: String, type: String, emoji: String, x: Number, y: Number, label: String, color: String, bg: String, border: String },
  { _id: false } // monog  do not add id 
);

// represent the connection between the components 
const edgeSchema = new mongoose.Schema(
  { id: String, from: String, to: String, label: String },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    // store the ref to the user and problem collection
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // get the user id from the user model and ref to the user collection 
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },// get the problem id from the problem model and ref to the problem collection

    problemTitle:    { type: String, required: true },
    isCustomProblem: { type: Boolean, default: false },

    diagramData: {
      nodes: [nodeSchema], // store the companents used in the design diagram
      edges: [edgeSchema],
    },
    diagramImage: { type: String },
    textExplanation: { type: String, default: "" },


    //AI Evaluation Fields
    // these are the fields that ai will return after evualiting the  user design 
    score:        { type: Number, min: 0, max: 10 },
    summary:      String,
    strengths:    [String],
    improvements: [String],
    weakAreas:    [String],
    referenceComponents: [String],


    // ── Standard Design Comparison
    missingCriticalComponents: [String],
    antiPatternsFound:         [String],
    scoringBreakdown: { // score will be given based on the following criteria and each criteria will have a score out of 10
      scalability:          Number,
      reliability:          Number,
      completeness:         Number,
      dataModeling:         Number,
      communicationClarity: Number,
    },
    comparisonWithStandard: {
      matchedComponents: [String],
      missingFromUser:   [String],
      userHadExtra:      [String],
      verdict:           String,
    },

    // time taken in the desing process by the user to design the system
    timeTaken: { type: Number, default: 0 }, // seconds
    status: {
      type: String,
      enum: ["draft", "submitted", "evaluated"], // only 3 state for the attempt 
      default: "draft", // means user is still working on the design and not submit yet
    },
  },
  { timestamps: true }
);

// Index for fast per-user chronological queries
attemptSchema.index({ user: 1, createdAt: -1 }); // 1 means ascending order of user id ,,, -1 means the newset desing first  

module.exports = mongoose.model("Attempt", attemptSchema);