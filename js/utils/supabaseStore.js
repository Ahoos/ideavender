const SUPABASE_URL = "https://ggchffjbwxprmndrhqhr.supabase.co";
const SUPABASE_KEY = "sb_publishable_DhMeV9bscQTMyWd3HQCJXQ_KnwPo9yr";
const TABLE = "hobby_bingo_states";
const ROW_ID = "default";
const STORAGE_KEY = "hobby-bingo-state-v1";

export async function loadStateData() {
  const local = readLocal();

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${ROW_ID}&select=payload`, {
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error(`Supabase load failed: ${response.status}`);
    const rows = await response.json();
    return rows[0]?.payload || local;
  } catch (error) {
    console.warn("Supabase load skipped. Using localStorage.", error);
    return local;
  }
}

export function saveStateData(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  syncRemote(payload);
}

function readLocal() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

async function syncRemote(payload) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=id`, {
      method: "POST",
      headers: {
        ...getHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: ROW_ID,
        payload,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) throw new Error(`Supabase save failed: ${response.status}`);
  } catch (error) {
    console.warn("Supabase save skipped. Local data is safe.", error);
  }
}

function getHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}
