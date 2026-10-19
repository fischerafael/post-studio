export type Provider = "openai" | "anthropic" | "google";
export type Tier = "small" | "medium" | "large";

export type TagColor =
  | "gray" | "brown" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple" | "pink" | "red";

export interface Category {
  id: string;
  name: string;
  tip: string;
  color: TagColor;
}

export interface Template {
  id: string;
  num?: number;
  cat: string;
  text: string;
  builtin: boolean;
}

export interface CustomTemplate {
  id: string;
  cat: string;
  text: string;
}

export interface Pillar {
  id: string;
  name: string;
  desc: string;
  subs: string[];
  genN?: number;
}

export interface Persona {
  id: string;
  name: string;
  desc: string;
  goal: string;
}

export interface Sample {
  id: string;
  text: string;
  note: string;
  format: string;
}

export interface Suggestion {
  tid: string;
  cat: string;
  pillar: string;
  sub: string;
  format: string;
  persona: string;
  hook: string;
  angle: string;
  draft: string;
  full: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  created?: number;
}

export interface GenSettings {
  n: number;
  formats: string[];
  allFormats: string[];
  lang: string;
  pillar: string;
  cats: string[];
  onlyFav: boolean;
  extra: string;
}

export interface LlmSettings {
  provider: Provider;
  keys: Record<Provider, string>;
  model: Record<Provider, string>;
  cache: Partial<Record<Provider, { at: number; items: ModelInfo[] }>>;
}

/** Parâmetros usados na última geração, para exibir junto do resultado. */
export interface RunInfo {
  at: number;
  provider: Provider;
  model: string;
  n: number;
  formats: string[];
  pillar: string;
  cats: string[];
  onlyFav: boolean;
  lang: string;
  extra: string;
  pool: number;
  samples: number;
  rules: number;
}

export interface State {
  rules: string[];
  /** CTA padrão, anexado ao fim de todo post completo. */
  cta: string;
  /** Sub-pilares usados nas últimas gerações ("pilarId|sub"), mais recente primeiro. */
  recentSubs: string[];
  lastRun: RunInfo | null;
  tplOver: Record<string, string>;
  tplOff: string[];
  tplFav: string[];
  tplCustom: CustomTemplate[];
  pillars: Pillar[];
  bio: string;
  audience: Persona[];
  samples: Sample[];
  settings: GenSettings;
  results: Suggestion[];
  llm: LlmSettings;
}
