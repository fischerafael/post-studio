import type { Provider } from "./types";

export interface CompleteArgs {
  provider: Provider;
  key: string;
  model: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

async function fail(res: Response): Promise<never> {
  if (res.status === 401 || res.status === 403) throw new Error("Chave inválida ou sem permissão.");
  if (res.status === 429) throw new Error("Limite de uso atingido. Espere um pouco e tente de novo.");
  let msg = `Erro ${res.status}`;
  try {
    const j = await res.json();
    const m = j?.error?.message ?? j?.message;
    if (m) msg = `${res.status}: ${m}`;
  } catch {}
  throw new Error(msg);
}

/** Uma chamada de texto, direto do navegador para o provedor escolhido. */
export async function complete(a: CompleteArgs): Promise<string> {
  const max = a.maxTokens ?? 4096;

  if (a.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: a.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${a.key}` },
      body: JSON.stringify({ model: a.model, instructions: a.system, input: a.prompt }),
    });
    if (!res.ok) await fail(res);
    const j = await res.json();
    if (typeof j.output_text === "string") return j.output_text;
    return ((j.output ?? []) as { type: string; content?: { type: string; text?: string }[] }[])
      .filter((o) => o.type === "message")
      .flatMap((o) => o.content ?? [])
      .filter((c) => c.type === "output_text")
      .map((c) => c.text ?? "")
      .join("");
  }

  if (a.provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: a.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": a.key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: a.model,
        max_tokens: max,
        system: a.system,
        messages: [{ role: "user", content: a.prompt }],
      }),
    });
    if (!res.ok) await fail(res);
    const j = await res.json();
    return ((j.content ?? []) as { type: string; text?: string }[])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(a.model)}:generateContent`,
    {
      method: "POST",
      signal: a.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": a.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: a.system }] },
        contents: [{ role: "user", parts: [{ text: a.prompt }] }],
        generationConfig: { maxOutputTokens: Math.max(max, 8192) },
      }),
    }
  );
  if (!res.ok) await fail(res);
  const j = await res.json();
  const parts = (j.candidates?.[0]?.content?.parts ?? []) as { text?: string }[];
  const text = parts.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("O modelo não devolveu texto. Tente de novo.");
  return text;
}

/** Extrai JSON de uma resposta que pode vir com cercas de código ou texto em volta. */
export function parseJson<T>(text: string): T {
  const clean = text.replace(/```(?:json)?/gi, "").trim();
  const starts = [clean.indexOf("["), clean.indexOf("{")].filter((i) => i >= 0);
  if (!starts.length) throw new Error("Resposta sem JSON.");
  const start = Math.min(...starts);
  const open = clean[start];
  const end = clean.lastIndexOf(open === "[" ? "]" : "}");
  if (end < start) throw new Error("JSON incompleto na resposta.");
  return JSON.parse(clean.slice(start, end + 1)) as T;
}
