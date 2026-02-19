/* ---------------- Base URLs ---------------- */

export const API_BASE = "https://fyp-thrivetrack.onrender.com";

console.log("API_BASE =", API_BASE);


/* ---------------- Helpers ---------------- */

function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Request timeout")), ms);
    p.then((v) => { clearTimeout(id); resolve(v); })
     .catch((e) => { clearTimeout(id); reject(e); });
  });
}

async function http<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await withTimeout(fetch(url, init));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

/* ---------------- API Calls ---------------- */

export async function createMoodEntry(input: {
  user_id: string;
  mood: string;
  notes?: string;
}) {
  return http(`${API_BASE}/mood_entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function listMoodEntries(user_id?: string) {
  const url = user_id
    ? `${API_BASE}/mood_entries?user_id=${encodeURIComponent(user_id)}`
    : `${API_BASE}/mood_entries`;
  return http(url);
}
