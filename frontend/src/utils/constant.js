export const DEFAULT_PROBLEMS = [
    { slug: "url-shortener", title: "Design a URL Shortener", difficulty: "Easy", tags: ["Hashing", "Database", "API Gateway"], time: "30", icon: "🔗", color: "#0EA5E9" },
    { slug: "twitter", title: "Design a Twitter/X", difficulty: "Hard", tags: ["Feed", "Scale", "Cache", "CDN"], time: "60", icon: "🐦", color: "#1DA1F2" },
    { slug: "chat", title: "Design a real-time chat app", difficulty: "Medium", tags: ["WebSocket", "Messaging", "Queue"], time: "30", icon: "💬", color: "#E50914" },
    { slug: "netflix", title: "Design a Netflix", difficulty: "Hard", tags: ["CDN", "Streaming", "Load Balancer"], time: "60", icon: "🎬", color: "#1a1a1a" },
    { slug: "rate-limiter", title: "Design a rate limiter", difficulty: "Medium", tags: ["Redis", "Algorithm", "API Gateway"], time: "30", icon: "⏱️", color: "#E50914" },
    { slug: "google-drive", title: "Design a Google Drive", difficulty: "Medium", tags: ["Storage", "Sync", "Auth", "Metadata DB"], time: "60", icon: "📁", color: "#25D366" },
    { slug: "whatsapp", title: "Design a WhatsApp", difficulty: "Medium", tags: ["Message", "E2E", "Push"], time: "60", icon: "💬", color: "#25D366" },
    { slug: "uber", title: "Design a Uber", difficulty: "Hard", tags: ["GPS", "Matching", "Real-Time"], time: "45", icon: "🚗", color: "#1a1a1a" },
    { slug: "youtube", title: "Design a Youtube", difficulty: "Hard", tags: ["CDN", "Streaming", "Storage"], time: "60", icon: "▶", color: "#FF0000" },
];

export const DIAGRAM_COMPONENTS = [
    { type: "Client", emoji: "👤" },
    { type: "Load Balancer", emoji: "⚖️" },
    { type: "API Gateway", emoji: "🚪" },
    { type: "Microservice", emoji: "⚙️" },
    { type: "Database", emoji: "🗄️" },
    { type: "Cache (Redis)", emoji: "⚡" },
    { type: "Message Queue", emoji: "📨" },
    { type: "CDN", emoji: "🌐" },
    { type: "Auth Service", emoji: "🔐" },
    { type: "Search Engine", emoji: "🔍" },
    { type: "Storage (S3)", emoji: "📦" },
    { type: "Monitoring", emoji: "📊" },
    { type: "Message Broker", emoji: "🔀" },
    { type: "Rate Limiter", emoji: "🛡️" },
    { type: "Kafka", emoji: "🌊" },
    { type: "WebSocket", emoji: "🔌" },
];

export const NODE_STYLES = {
    "Client": { bg: "#EFF6FF", darkBg: "#1e3a5f", border: "#3B82F6", color: "#1D4ED8" },
    "Load Balancer": { bg: "#F0FDF4", darkBg: "#14532d", border: "#22C55E", color: "#15803D" },
    "API Gateway": { bg: "#FFF7ED", darkBg: "#7c2d12", border: "#F97316", color: "#C2410C" },
    "Microservice": { bg: "#FAF5FF", darkBg: "#3b0764", border: "#A855F7", color: "#7E22CE" },
    "Database": { bg: "#FFF1F2", darkBg: "#4c0519", border: "#F43F5E", color: "#BE123C" },
    "Cache (Redis)": { bg: "#FFFBEB", darkBg: "#422006", border: "#EAB308", color: "#A16207" },
    "Message Queue": { bg: "#ECFEFF", darkBg: "#083344", border: "#06B6D4", color: "#0E7490" },
    "CDN": { bg: "#FDF4FF", darkBg: "#4a044e", border: "#D946EF", color: "#A21CAF" },
    "Auth Service": { bg: "#F8FAFC", darkBg: "#1e293b", border: "#64748B", color: "#334155" },
    "Search Engine": { bg: "#FFF7ED", darkBg: "#431407", border: "#FB923C", color: "#C2410C" },
    "Storage (S3)": { bg: "#F0FDF4", darkBg: "#052e16", border: "#4ADE80", color: "#166534" },
    "Monitoring": { bg: "#EFF6FF", darkBg: "#1e3a5f", border: "#60A5FA", color: "#1D4ED8" },
    "Message Broker": { bg: "#FDF4FF", darkBg: "#2e1065", border: "#8B5CF6", color: "#6D28D9" },
    "Rate Limiter": { bg: "#FFF1F2", darkBg: "#450a0a", border: "#F87171", color: "#B91C1C" },
    "Kafka": { bg: "#ECFEFF", darkBg: "#083344", border: "#22D3EE", color: "#0891B2" },
    "WebSocket": { bg: "#F0FDF4", darkBg: "#14532d", border: "#34D399", color: "#059669" },
};

export const getNodeStyle = (type, theme) => {
    const s = NODE_STYLES[type] || NODE_STYLES["Microservice"];
    return { bg: theme === "dark" ? s.darkBg : s.bg, border: s.border, color: s.color };
};