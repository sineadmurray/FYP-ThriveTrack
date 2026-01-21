/* ---------------- Base URLs ---------------- */

// Your LAN API (works if phone & laptop are on the same Wi-Fi)
const LAN = "http://192.168.1.23:4000";

const TUNNEL: string | null = "https://starla-nonreturn-jody.ngrok-free.dev";

/* Pick which base URL to use */
export const API_BASE: string = TUNNEL && TUNNEL.length > 0 ? TUNNEL : LAN;

console.log("API_BASE =", API_BASE);

// (Optional) simulator URLs (kept for reference; not used here)
const IOS_SIM = "http://localhost:4000";
const ANDROID_EMU = "http://10.0.2.2:4000";

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
