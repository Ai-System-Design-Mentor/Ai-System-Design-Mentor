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