const mongoose = require("mongoose");
const SEED_PROBLEMS = require("../data/constantProblem");

const problemSchema = new mongoose.Schema(
    {
        slug: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        icon: { type: String, default: "⚙️" },
        color: { type: String, default: "#2563EB" },
        difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
        estimatedTime: { type: Number, default: 45 }, // minutes
        tags: [String],
        description: String,
        requirements: [String],
        constraints: [String],
        hints: [String],
        // Full industry-standard reference design (used for evaluation & comparison)
        standardDesign: {
            summary: String,
            components: [String],
            keyFlows: mongoose.Schema.Types.Mixed,
            scalabilityDecisions: [String],
            faultToleranceMechanisms: [String],
            criticalComponents: [String],
            antiPatterns: [String],
            estimatedScale: mongoose.Schema.Types.Mixed,
        },
        isCustom: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// if db is empty auto seed this standard problems
problemSchema.statics.seedIfEmpty = async function () {
    for (const problem of SEED_PROBLEMS) {
        await this.updateOne(
            { slug: problem.slug },
            { $setOnInsert: problem },
            { upsert: true }
        );
    }
    console.log("Problems seeded (only new ones added)");
};

const Problem = mongoose.model("Problem", problemSchema);

// Seed 2 seconds after DB connects (gives mongoose time to register the model)
setTimeout(() => Problem.seedIfEmpty().catch(console.error), 2000);

module.exports = Problem;