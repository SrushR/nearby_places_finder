export const API = import.meta.env.VITE_API || "http://localhost:8000";

// One place for every backend call: adds the JWT, turns failures into readable errors.
export async function api(path, opts = {}) {
  const token = localStorage.getItem("token");
  const isForm = opts.body instanceof FormData;
  let res;
  try {
    res = await fetch(API + path, {
      ...opts,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  } catch {
    throw new Error("Cannot reach the server. Please try again.");
  }
  if (res.status === 401 && token) {
    localStorage.removeItem("token");
    location.reload(); // back to login
  }
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data.detail;
    throw new Error(
      typeof d === "string" ? d : Array.isArray(d) ? d.map((e) => e.msg).join(", ") : "Request failed"
    );
  }
  return data;
}
