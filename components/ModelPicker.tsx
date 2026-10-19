"use client";

import { pickTiers, TIERS, tierOf } from "../lib/models";
import { useStore } from "../lib/store";

/** Três botões (rápido, médio, parrudo) com os modelos atuais do provedor. */
export function TierPicker() {
  const { s, update } = useStore();
  const p = s.llm.provider;
  const items = s.llm.cache[p]?.items ?? [];
  const picks = pickTiers(p, items);
  const current = s.llm.model[p];
  const active = tierOf(p, items, current);
  return (
    <div className="row">
      <div className="seg" role="group" aria-label="Modelo">
        {TIERS.map((t) => {
          const m = picks[t.id];
          return (
            <button
              key={t.id}
              aria-pressed={active === t.id}
              disabled={!m}
              title={m ? m.name : "Conecte a chave em Configurações"}
              onClick={() => m && update((d) => void (d.llm.model[p] = m.id))}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <span className="small muted mono">{current || "nenhum modelo"}</span>
    </div>
  );
}
