import type { ModelInfo, Provider, Tier } from "./types";

export const PROVIDERS: { id: Provider; name: string; keyHint: string; keyUrl: string }[] = [
  { id: "openai", name: "OpenAI", keyHint: "sk-...", keyUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", keyHint: "sk-ant-...", keyUrl: "https://console.anthropic.com/settings/keys" },
  { id: "google", name: "Google", keyHint: "AIza...", keyUrl: "https://aistudio.google.com/apikey" },
];

export const TIERS: { id: Tier; label: string; hint: string }[] = [
  { id: "small", label: "Rápido", hint: "pequeno e barato" },
  { id: "medium", label: "Médio", hint: "equilíbrio" },
  { id: "large", label: "Parrudo", hint: "o mais capaz" },
];

async function errorMessage(res: Response): Promise<string> {
  if (res.status === 401 || res.status === 403) return "Chave inválida ou sem permissão.";
  try {
    const j = await res.json();
    const m = j?.error?.message ?? j?.message;
    if (m) return `${res.status}: ${m}`;
  } catch {}
  return `Erro ${res.status}`;
}

/** Busca a lista de modelos do provedor, direto do navegador. */
export async function fetchModels(provider: Provider, key: string): Promise<ModelInfo[]> {
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    const j = await res.json();
    const skip = /(audio|realtime|transcribe|tts|image|search|embedding|moderation|instruct|vision|whisper|dall|davinci|babbage|codex|computer|deep-research|chat-latest|diagnostic|sora)/;
    return (j.data as { id: string; created?: number }[])
      .filter((m) => /^(gpt-|o\d)/.test(m.id) && !skip.test(m.id))
      .map((m) => ({ id: m.id, name: m.id, created: m.created }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=1000", {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    const j = await res.json();
    return (j.data as { id: string; display_name?: string; created_at?: string }[]).map((m) => ({
      id: m.id,
      name: m.display_name || m.id,
      created: m.created_at ? Math.floor(Date.parse(m.created_at) / 1000) : undefined,
    }));
  }
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
    headers: { "x-goog-api-key": key },
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const j = await res.json();
  const skip = /(image|tts|embed|live|audio|robotics|computer|aqa|vision|veo|imagen)/;
  return (j.models as { name: string; displayName?: string; supportedGenerationMethods?: string[] }[])
    .filter(
      (m) =>
        m.name.includes("gemini") &&
        (m.supportedGenerationMethods ?? []).includes("generateContent") &&
        !skip.test(m.name)
    )
    .map((m) => ({ id: m.name.replace(/^models\//, ""), name: m.displayName || m.name }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/* ---------- Escolha dos modelos mais populares por faixa ---------- */

const isDated = (id: string) => /(-\d{4}-\d{2}-\d{2}|-\d{8}|-\d{3}$|preview|exp)/.test(id);

function versionOf(id: string, re: RegExp): number {
  const m = id.match(re);
  return m ? parseFloat(m[1]) : 0;
}

/** Entre os que casam com `family`, devolve o de maior versão (estável antes de preview/datado). */
function newest(items: ModelInfo[], family: RegExp, versionRe: RegExp): ModelInfo | undefined {
  const c = items.filter((m) => family.test(m.id));
  if (!c.length) return undefined;
  return c.sort((a, b) => {
    const v = versionOf(b.id, versionRe) - versionOf(a.id, versionRe);
    if (v) return v;
    if (a.created && b.created && a.created !== b.created) return b.created - a.created;
    const d = Number(isDated(a.id)) - Number(isDated(b.id));
    if (d) return d;
    return a.id.length - b.id.length;
  })[0];
}

export function pickTiers(provider: Provider, items: ModelInfo[]): Partial<Record<Tier, ModelInfo>> {
  if (provider === "anthropic") {
    const byDate = (re: RegExp) => items.filter((m) => re.test(m.id)).sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];
    return { small: byDate(/haiku/i), medium: byDate(/sonnet/i), large: byDate(/opus/i) };
  }
  if (provider === "openai") {
    const v = /^gpt-(\d+(?:\.\d+)?)/;
    const stable = items.filter((m) => !isDated(m.id));
    const pool = stable.length ? stable : items;
    return {
      small: newest(pool, /^gpt-\d+(\.\d+)?-mini$/, v) ?? newest(pool, /^gpt-\d+(\.\d+)?-nano$/, v),
      medium: newest(pool, /^gpt-\d+(\.\d+)?$/, v),
      large: newest(pool, /^gpt-\d+(\.\d+)?-pro$/, v) ?? newest(pool, /^o\d+(-pro)?$/, /^o(\d+)/),
    };
  }
  const v = /gemini-(\d+(?:\.\d+)?)/;
  return {
    small: newest(items, /flash-lite/, v),
    medium: newest(items.filter((m) => !/flash-lite/.test(m.id)), /flash/, v),
    large: newest(items, /pro/, v),
  };
}

export function tierOf(provider: Provider, items: ModelInfo[], modelId: string): Tier | null {
  const p = pickTiers(provider, items);
  for (const t of TIERS) if (p[t.id]?.id === modelId) return t.id;
  return null;
}
