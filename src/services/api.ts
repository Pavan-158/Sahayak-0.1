/**
 * Sahayak Backend API client
 * Talks to the FastAPI server (default http://localhost:8000).
 * Override with VITE_API_URL if the backend runs elsewhere.
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch (err) {
    // fetch() itself threw: network down, CORS preflight rejected, or bad TLS/DNS.
    // The browser hides the real reason ("Failed to fetch"), so log the details
    // and surface a message that points at the most common cause.
    console.error(
      `[api] Network error calling ${API_BASE}${path}.`,
      "Check: (1) backend running on port 8000? (2) Open http://localhost:8000/api/health in this browser tab.",
      err,
    );
    throw new Error(
      `Could not reach the backend at ${API_BASE}. Make sure it is running (uvicorn main:app --port 8000) — see the browser console for details.`,
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body);
    } catch {
      detail = await res.text().catch(() => res.statusText);
    }
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export interface UploadResult {
  id: string;
  filename: string;
  text_length: number;
  text_preview: string;
}

export interface SimplifyResult {
  id: string;
  simplified_text: string;
  language: string;
  provider: string;
}

export interface ChatResult {
  question: string;
  answer: string;
  document_id: string;
  provider: string;
}

export async function uploadDocument(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  return request<UploadResult>("/api/document/upload", { method: "POST", body: form });
}

export async function simplifyDocument(
  docId: string,
  language: string = "en",
  level: string = "10-year-old"
): Promise<SimplifyResult> {
  return request<SimplifyResult>(
    `/api/document/${docId}/simplify?language=${encodeURIComponent(language)}&level=${encodeURIComponent(level)}`,
    { method: "POST" }
  );
}

export async function chatWithDocument(
  docId: string,
  message: string,
  history: { role: string; content: string }[] = []
): Promise<ChatResult> {
  return request<ChatResult>(`/api/document/${docId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, document_id: docId, history }),
  });
}
