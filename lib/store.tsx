"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CATEGORIES, DEFAULT_TEMPLATES } from "./templates";
import type { State, Template } from "./types";

const KEY = "estudio-de-posts:v1";
export const uid = () => Math.random().toString(36).slice(2, 9);

export const DEFAULT_FORMATS = [
  "LinkedIn texto",
  "LinkedIn carrossel",
  "LinkedIn com meme",
  "Reel / vídeo curto",
  "Instagram carrossel",
  "Post de Substack",
];

function initial(): State {
  return {
    tplOver: {},
    tplOff: [],
    tplFav: [],
    tplCustom: [],
    pillars: [
      { id: uid(), name: "Engenharia de software e clean code", desc: "", subs: [] },
      { id: uid(), name: "IA e LLMs na prática", desc: "", subs: [] },
      { id: uid(), name: "Carreira em tecnologia", desc: "", subs: [] },
    ],
    bio: "Rafael Fischer, PhD. Dev fullstack sênior brasileiro. Escreve sobre engenharia de software, clean code, IA/LLMs e carreira.",
    audience: [
      { id: uid(), name: "João", desc: "Dev iniciante ou pleno.", goal: "Entrar no radar: conteúdo fácil de salvar e compartilhar." },
      { id: uid(), name: "Mariana", desc: "Dev sênior inquieta.", goal: "Autoridade: opinião técnica com profundidade." },
      { id: uid(), name: "Carlos", desc: "Founder técnico internacional.", goal: "Conversão: levar protótipos de IA para produção." },
    ],
    samples: [],
    rules: [],
    cta: "",
    recentSubs: [],
    lastRun: null,
    settings: {
      n: 3,
      formats: ["LinkedIn texto", "LinkedIn carrossel"],
      allFormats: [...DEFAULT_FORMATS],
      lang: "Português do Brasil",
      pillar: "all",
      cats: CATEGORIES.map((c) => c.id),
      onlyFav: false,
      extra: "",
    },
    results: [],
    llm: {
      provider: "anthropic",
      keys: { openai: "", anthropic: "", google: "" },
      model: { openai: "", anthropic: "", google: "" },
      cache: {},
    },
  };
}

function merge(base: State, saved: Partial<State>): State {
  return {
    ...base,
    ...saved,
    settings: { ...base.settings, ...(saved.settings ?? {}) },
    llm: {
      ...base.llm,
      ...(saved.llm ?? {}),
      keys: { ...base.llm.keys, ...(saved.llm?.keys ?? {}) },
      model: { ...base.llm.model, ...(saved.llm?.model ?? {}) },
      cache: { ...(saved.llm?.cache ?? {}) },
    },
  };
}

interface Ctx {
  s: State;
  ready: boolean;
  update: (fn: (draft: State) => void) => void;
  templates: Template[];
  textOf: (t: Template) => string;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS((prev) => merge(prev, JSON.parse(raw)));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }, [s, ready]);

  const update = useCallback((fn: (d: State) => void) => {
    setS((prev) => {
      const d = structuredClone(prev);
      fn(d);
      return d;
    });
  }, []);

  const templates = useMemo<Template[]>(
    () => [...DEFAULT_TEMPLATES, ...s.tplCustom.map((c) => ({ id: c.id, cat: c.cat, text: c.text, builtin: false }))],
    [s.tplCustom]
  );
  const textOf = useCallback((t: Template) => (t.builtin && s.tplOver[t.id]) || t.text, [s.tplOver]);

  return <StoreCtx.Provider value={{ s, ready, update, templates, textOf }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider ausente");
  return c;
}

export function toggle<T>(arr: T[], v: T) {
  const i = arr.indexOf(v);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(v);
}
