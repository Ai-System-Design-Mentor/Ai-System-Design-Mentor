const mongoose       = require("mongoose");
const STANDARD_DESIGNS = require("../data/standardDesigns");

const problemSchema = new mongoose.Schema(
  {
    slug:          { type: String, required: true, unique: true },
    title:         { type: String, required: true },
    icon:          { type: String, default: "⚙️" },
    color:         { type: String, default: "#2563EB" },
    difficulty:    { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    estimatedTime: { type: Number, default: 45 }, // minutes
    tags:          [String],
    description:   String,
    requirements:  [String],
    constraints:   [String],
    hints:         [String],
    // Full industry-standard reference design (used for evaluation & comparison)
    standardDesign: {
      summary:                  String,
      components:               [String],
      keyFlows:                 mongoose.Schema.Types.Mixed,
      scalabilityDecisions:     [String],
      faultToleranceMechanisms: [String],
      criticalComponents:       [String],
      antiPatterns:             [String],
      estimatedScale:           mongoose.Schema.Types.Mixed,
    },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Seed data 
const SEED = [
  {
    slug: "youtube", title: "Design YouTube", icon: "▶", color: "#FF0000",
    difficulty: "Medium", estimatedTime: 60,
    tags: ["CDN", "Streaming", "Storage", "Video"],
    description: "Design a video streaming platform like YouTube that supports uploading, storing, and streaming videos to millions of users worldwide.",
    requirements: ["Users can upload videos up to 4K resolution", "Support adaptive bitrate streaming", "Video recommendations feed", "Comments, likes, and subscriptions", "Full-text video search"],
    constraints: ["500 hours of video uploaded every minute", "2 billion logged-in users per month", "1 billion hours watched daily"],
    hints: ["Where do the raw video files live after upload?", "How does the video get to a user in Tokyo with minimal buffering?", "Transcoding takes time — should upload block until it's done?"],
    standardDesign: STANDARD_DESIGNS.youtube,
  },
  {
    slug: "uber", title: "Design Uber", icon: "🚗", color: "#000000",
    difficulty: "Hard", estimatedTime: 45,
    tags: ["GPS", "Matching", "Real-time", "Maps"],
    description: "Design a ride-sharing platform that matches riders with the nearest available drivers in real-time.",
    requirements: ["Real-time driver location tracking", "Efficient rider-driver matching algorithm", "Dynamic surge pricing", "Trip lifecycle management", "In-app payment processing"],
    constraints: ["Millions of concurrent users worldwide", "Driver GPS updates every 4 seconds", "Match a rider to a driver within 30 seconds"],
    hints: ["How do you find the 5 nearest drivers to a rider in under 100ms?", "HTTP request-response or persistent connection for location updates?", "What happens to unmatched trips if the matching server crashes?"],
    standardDesign: STANDARD_DESIGNS.uber,
  },
  {
    slug: "whatsapp", title: "Design WhatsApp", icon: "💬", color: "#25D366",
    difficulty: "Medium", estimatedTime: 60,
    tags: ["Messaging", "E2E Encryption", "Push Notifications"],
    description: "Design an end-to-end encrypted messaging platform supporting 1-1 chats, group chats, and media sharing at massive scale.",
    requirements: ["1-1 and group messaging", "Media sharing (photos, videos, documents)", "Message delivery and read receipts", "Online/offline presence", "End-to-end encryption"],
    constraints: ["2 billion users", "100 billion messages per day", "Message delivery within 1 second"],
    hints: ["How do you deliver a message when the recipient is offline?", "E2E encryption means the server stores what exactly?", "For a group with 500 members, who creates the 500 copies of the message?"],
    standardDesign: STANDARD_DESIGNS.whatsapp,
  },
  {
    slug: "url-shortener", title: "Design URL Shortener", icon: "🔗", color: "#0EA5E9",
    difficulty: "Easy", estimatedTime: 30,
    tags: ["Hashing", "Redirect", "Cache", "Analytics"],
    description: "Design a URL shortening service like bit.ly that transforms long URLs into short memorable links.",
    requirements: ["Shorten any valid URL to 6-8 characters", "Redirect short URL to original within 100ms", "Support custom aliases", "Track click analytics (count, location, device)", "Support link expiration"],
    constraints: ["100 million URLs shortened per day", "10 billion redirects per day", "Redirect P99 latency under 100ms"],
    hints: ["How do you guarantee the 6-char code is unique across 100M daily creations?", "What happens on every redirect if you always hit the database?", "How do you handle analytics without slowing down the redirect?"],
    standardDesign: STANDARD_DESIGNS["url-shortener"],
  },
  {
    slug: "twitter", title: "Design Twitter / X", icon: "🐦", color: "#1DA1F2",
    difficulty: "Hard", estimatedTime: 60,
    tags: ["Feed", "Social Graph", "Search", "Trending"],
    description: "Design a social media platform supporting tweet posting, follower-based feeds, trending topics, and full-text search.",
    requirements: ["Post tweets up to 280 characters with media", "Follow / unfollow users", "Personalised home timeline", "Full-text tweet and user search", "Real-time trending hashtags"],
    constraints: ["238 million daily active users", "500 million tweets per day", "Home timeline load under 2 seconds"],
    hints: ["If a celebrity has 100M followers and tweets, do you write 100M records immediately?", "Where does the home timeline come from — database query or precomputed cache?", "How does search find tweets about 'earthquake' in real-time?"],
    standardDesign: STANDARD_DESIGNS.twitter,
  },
  {
    slug: "netflix", title: "Design Netflix", icon: "🎬", color: "#E50914",
    difficulty: "Hard", estimatedTime: 60,
    tags: ["CDN", "Encoding", "Streaming", "Recommendation"],
    description: "Design a global video streaming service delivering personalised content to 200M+ subscribers across all devices.",
    requirements: ["Stream video to any device globally", "AI-powered content recommendation engine", "Support 240p through 4K quality levels", "Offline download capability", "Cross-device continue watching"],
    constraints: ["238 million subscribers in 190 countries", "Responsible for 15% of global internet bandwidth at peak", "Content startup time under 2 seconds"],
    hints: ["Netflix has its own CDN called Open Connect — why not just use CloudFront?", "A 4K movie is ~100GB raw. What happens before it's available on Netflix?", "If the recommendation service is down, what does the home page show?"],
    standardDesign: STANDARD_DESIGNS.netflix,
  },
];

// if db is empty auto seed this standard problems 
problemSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.insertMany(SEED);
    console.log("✅ 6 problems seeded with standard reference designs");
  }
};

const Problem = mongoose.model("Problem", problemSchema);

// Seed 2 seconds after DB connects (gives mongoose time to register the model)
setTimeout(() => Problem.seedIfEmpty().catch(console.error), 2000);

module.exports = Problem;