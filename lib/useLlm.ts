"use client";

import { useCallback } from "react";
import { complete, parseJson } from "./llm";
import { useStore } from "./store";
import { SYSTEM } from "./prompts";

/** Chamadas ao provedor escolhido, com a chave e o modelo salvos. */
export function useLlm() {
  const { s } = useStore();
  const { provider, keys, model } = s.llm;
  const key = keys[provider];
  const modelId = model[provider];
  const ready = !!key && !!modelId;

  const text = useCallback(
    async (prompt: string, maxTokens = 4096) => {
      if (!key) throw new Error("Adicione sua chave em Configurações.");
      if (!modelId) throw new Error("Escolha um modelo em Configurações.");
      return complete({ provider, key, model: modelId, system: SYSTEM, prompt, maxTokens });
    },
    [provider, key, modelId]
  );

  const json = useCallback(
    async <T,>(prompt: string, maxTokens = 4096) => parseJson<T>(await text(prompt, maxTokens)),
    [text]
  );

  return { ready, text, json, provider, modelId };
}
