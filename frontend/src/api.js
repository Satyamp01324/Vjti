/**
 * API Service — connects the React frontend to the FastAPI backend pipeline.
 *
 * Every function returns a Promise that resolves with the JSON body.
 * All data-mutating calls accept an optional `userId` to enable per-user isolation.
 */

const VITE_API_URL = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;
const API_BASE = (VITE_API_URL && VITE_API_URL !== "undefined")
  ? VITE_API_URL
  : (isDev ? "http://127.0.0.1:8000" : "");

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

/** Analyze text → returns analysis + energy + saves to Supabase (per-user) */
export async function analyzeText(text, userId = null) {
  const body = { text };
  if (userId) body.user_id = userId;
  return request("/api/analyze/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Analyze voice → transcribe + analysis + energy + saves to Supabase (per-user) */
export async function analyzeVoice(audioFile, userId = null) {
  const form = new FormData();
  form.append("audio", audioFile);
  if (userId) form.append("user_id", userId);
  return request("/api/analyze/voice", { method: "POST", body: form });
}

// ─── QUERY endpoints (read from Supabase, filtered by user) ─

/** Recent analysis sessions for the current user */
export async function getSessions(limit = 20, userId = null) {
  const params = new URLSearchParams({ limit });
  if (userId) params.set("user_id", userId);
  return request(`/api/sessions?${params}`);
}

/** Single session detail */
export async function getSession(sessionId) {
  return request(`/api/sessions/${sessionId}`);
}

/** Energy score history for the current user */
export async function getEnergyHistory(limit = 50, userId = null) {
  const params = new URLSearchParams({ limit });
  if (userId) params.set("user_id", userId);
  return request(`/api/energy-history?${params}`);
}

/** Daily average energy for the current user */
export async function getEnergyDaily(userId = null) {
  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);
  const qs = params.toString();
  return request(`/api/energy-daily${qs ? '?' + qs : ''}`);
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
 * Subscribe to new analysis sessions in realtime (filtered by user_id).
 */
export function subscribeToSessions(callback, userId = null) {
  const filter = userId
    ? { event: "INSERT", schema: "public", table: "analysis_sessions", filter: `user_id=eq.${userId}` }
    : { event: "INSERT", schema: "public", table: "analysis_sessions" };

  const channel = supabase
    .channel("analysis_sessions_changes")
    .on("postgres_changes", filter, (payload) => callback(payload.new))
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Subscribe to energy_history inserts for live chart updates (filtered by user_id).
 */
export function subscribeToEnergyHistory(callback, userId = null) {
  const filter = userId
    ? { event: "INSERT", schema: "public", table: "energy_history", filter: `user_id=eq.${userId}` }
    : { event: "INSERT", schema: "public", table: "energy_history" };

  const channel = supabase
    .channel("energy_history_changes")
    .on("postgres_changes", filter, (payload) => callback(payload.new))
    .subscribe();

  return () => supabase.removeChannel(channel);
}
