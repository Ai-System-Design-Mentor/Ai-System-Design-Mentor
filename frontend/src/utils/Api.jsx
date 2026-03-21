const BASE = import.meta.env.VITE_API_URL;

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

// ── Users ─────────────────────────────────────────────
export const usersApi = {
  getProfile:     ()                          => get("/users/profile"),
  updateProfile: (username)                  => patch("/users/profile", { username }),
  updatePassword: (currentPassword, newPassword) => patch("/users/password", { currentPassword, newPassword }),
};

export const authApi = {
    login:    (email, password)              => post("/auth/login",    { email, password }),
    register: (username, email, password)    => post("/auth/register", { username, email, password }),

    forgotPassword: (email, currentPassword, newPassword) =>
      fetch(`${BASE}/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, currentPassword, newPassword }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        return data;
      }),
  };

async function post(path, body) {
  const res  = await fetch(`${BASE}${path}`, {
    method:  "POST",
    headers: getHeaders(),
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function patch(path, body) {
  const res  = await fetch(`${BASE}${path}`, {
    method:  "PATCH",
    headers: getHeaders(),
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}