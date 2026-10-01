/**
 * Sahayak Backend API client
 * Talks to the FastAPI server (default http://localhost:8000).
 * Override with VITE_API_URL if the backend runs elsewhere.
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
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
