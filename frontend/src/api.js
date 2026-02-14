/**
 * API Service — connects the React frontend to the FastAPI backend pipeline.
 *
 * Every function returns a Promise that resolves with the JSON body.
 *
 * DATA SENT FROM BACKEND (per pipeline call):
 * ──────────────────────────────────────────────
 * {
 *   status:        "success" | "error",
 *   session_id:    string (UUID),
 *   input_text:    string,
 *   transcription: { text, language, language_name, method },   // voice only
 *   analysis: {
 *     depression:  number (0-1),
 *     anxiety:     number (0-1),
 *     stress:      number (0-1),
 *     source:      "local_model" | "groq_fallback_language"
 *   },
 *   energy_flow: {
 *     energy_score:            number (0-100),
 *     energy_category:         "high_energy" | "medium_energy" | "low_energy",
 *     recommended_task_type:   "heavy" | "medium" | "light",
 *     task_description:        string,
 *     task_suggestions:        string[],
 *     classified_levels:       { stress, anxiety, depression, tone },
 *     impact_breakdown:        { stress_impact, anxiety_impact, depression_impact, tone_impact, total_impact },
 *     base_energy:             number,
 *   },
 *   audio_info:    { filename, content_type, size_bytes, storage_url },  // voice only
 *   persisted:     boolean,
 * }
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ─── helpers ─────────────────────────────────────────────────

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ─── PIPELINE endpoints (auto-persist to Supabase) ──────────

/** Analyze text → returns analysis + energy + saves to Supabase */
export async function analyzeText(text) {
  return request("/api/analyze/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

/** Analyze voice → transcribe + analysis + energy + saves to Supabase */
export async function analyzeVoice(audioFile) {
  const form = new FormData();
  form.append("audio", audioFile);
  return request("/api/analyze/voice", { method: "POST", body: form });
}

// ─── QUERY endpoints (read from Supabase) ───────────────────

/** Recent analysis sessions (for history list) */
export async function getSessions(limit = 20) {
  return request(`/api/sessions?limit=${limit}`);
}

/** Single session detail */
export async function getSession(sessionId) {
  return request(`/api/sessions/${sessionId}`);
}

/** Energy score history (for trend line chart) */
export async function getEnergyHistory(limit = 50) {
  return request(`/api/energy-history?limit=${limit}`);
}

/** Daily average energy (for bar/line chart) */
export async function getEnergyDaily() {
  return request("/api/energy-daily");
}

// ─── STANDALONE endpoints (no persistence) ──────────────────

/** Quick text classification (no save) */
export async function quickTextAnalysis(text) {
  return request("/api/text-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

/** Manual energy calculation (no save) */
export async function calculateEnergy({ stress_level, anxiety_level, depression_level, tone, base_energy = 70 }) {
  return request("/api/energy-calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stress_level, anxiety_level, depression_level, tone, base_energy }),
  });
}

// ─── HEALTH / INFO ──────────────────────────────────────────

export async function healthCheck() {
  return request("/api/health");
}

export async function getModelInfo() {
  return request("/api/model-info");
}

export async function testSupabase() {
  return request("/api/test-supabase");
}

// ─── SUPABASE REALTIME (optional, direct subscription) ──────

import { supabase } from "./supabaseClient";

/**
 * Subscribe to new analysis sessions in realtime.
 * Usage:
 *   const unsub = subscribeToSessions((newRow) => console.log(newRow));
 *   // later: unsub();
 */
export function subscribeToSessions(callback) {
  const channel = supabase
    .channel("analysis_sessions_changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "analysis_sessions" },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Subscribe to energy_history inserts for live chart updates.
 */
export function subscribeToEnergyHistory(callback) {
  const channel = supabase
    .channel("energy_history_changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "energy_history" },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
