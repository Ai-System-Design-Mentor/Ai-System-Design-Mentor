const BASE = import.meta.env.VITE_API_URL;

function getHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}

// get Helper
async function get(path) {
    const res = await fetch(`${BASE}${path}`, {
        method: "GET",
        headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

// post Helper
async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

// patch helper
async function patch(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

// put Helper
async function put(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

// del Helper
async function del(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

// Generic API
export const api = {
    get: (path) => get(path),
    post: (path, body) => post(path, body),
    put: (path, body) => put(path, body),
    patch: (path, body) => patch(path, body),
    delete: (path) => del(path),
};

// User API
export const usersApi = {
    getProfile: () => get("/users/profile"),
    updateProfile: (username) => patch("/users/profile", { username }),
    updatePassword: (currentPassword, newPassword) => patch("/users/password", { currentPassword, newPassword }),
};

// Authentication API
export const authApi = {
    login: (email, password) => post("/auth/login", { email, password }),
    register: (username, email, password) => post("/auth/register", { username, email, password }),

    forgotPassword: (email, currentPassword, newPassword) =>
        fetch(`${BASE}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, currentPassword, newPassword }),
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Request failed");
            return data;
        }),
};

// Chat API
export const chatApi = {
    send: (message, problemTitle, problemSlug, history, currentDiagram) =>
        post("/chat", {
            message,
            problemTitle,
            problemSlug,
            conversationHistory: history,
            currentDiagram,
        }),

    getHint: (problemTitle, problemSlug, currentDiagram, stuckOn) =>
        post("/chat/hint", { problemTitle, problemSlug, currentDiagram, stuckOn }),

    generateProblem: (systemName) =>
        post("/chat/generate-problem", { systemName }),
};

// Problems API
export const problemsApi = {
    getAll: () => get("/problems"),
    getBySlug: (slug) => get(`/problems/${slug}`),
};

// Designs API
export const designsApi = {
    submit: (data) => post("/designs", data),
    getAll: () => get("/designs"),
    getById: (id) => get(`/designs/${id}`),
};
