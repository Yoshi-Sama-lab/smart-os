const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, token, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // ---- Study ----
  getLogs: (token) => request("/study", token),

  addLog: (token, log) =>
    request("/study", token, {
      method: "POST",
      body: JSON.stringify(log),
    }),
    
  deleteLog: (token, id) =>
    request(`/study/${id}`, token, {
      method: "DELETE",
    }),
  // ---- Goals ----
  getGoal: (token) => request("/goals", token),

  setGoal: (token, goal) =>
    request("/goals", token, {
      method: "POST",
      body: JSON.stringify(goal),
    }),

  // ---- Schedule ----
  getSchedule: (token) => request("/schedule", token),

  addScheduleEvent: (token, event) =>
    request("/schedule", token, {
      method: "POST",
      body: JSON.stringify(event),
    }),

  updateScheduleEvent: (token, id, patch) =>
    request(`/schedule/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};