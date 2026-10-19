"use client";

import { useState } from "react";
import { subsPrompt } from "../lib/prompts";
import { uid, useStore } from "../lib/store";
import { useLlm } from "../lib/useLlm";
import { Empty, toast } from "./ui";

export function PilaresView({ goConfig }: { goConfig: () => void }) {
  const { s, update } = useStore();
  const llm = useLlm();
  const [busy, setBusy] = useState<string | null>(null);
  const [subDraft, setSubDraft] = useState<Record<string, string>>({});

  async function gen(id: string) {
    const p = s.pillars.find((x) => x.id === id);
    if (!p) return;
    if (!llm.ready) return goConfig();
    setBusy(id);
    try {
      const out = await llm.json<string[] | { subpilares?: string[] }>(subsPrompt(s, p, p.genN ?? 5), 1500);
      const arr = Array.isArray(out) ? out : out.subpilares ?? [];
      update((d) => {
        const dp = d.pillars.find((x) => x.id === id)!;
        arr.forEach((x) => {
          const v = String(x).trim();
          if (v && !dp.subs.includes(v)) dp.subs.push(v);
        });
      });
    } catch (e) {
      toast((e as Error).message);
    }
    setBusy(null);
  }

  return (
    <>
      <h1>Pilares</h1>
      <p className="lead">Os temas que sustentam o seu conteúdo. Peça sub-pilares ao modelo ou escreva os seus.</p>
      <button className="btn pri" onClick={() => update((d) => void d.pillars.push({ id: uid(), name: "Novo pilar", desc: "", subs: [] }))}>Novo pilar</button>

      {!s.pillars.length && <Empty title="Nenhum pilar ainda">Adicione o primeiro.</Empty>}

      <div className="cards" style={{ marginTop: 20 }}>
        {s.pillars.map((p, i) => (
          <div className="card" key={p.id}>
            <input
              className="input"
              style={{ fontWeight: 600 }}
              value={p.name}
              aria-label="Nome do pilar"
              onChange={(e) => update((d) => void (d.pillars[i].name = e.target.value))}
            />
            <input
              className="input"
              placeholder="Descrição (opcional)"
              value={p.desc}
              aria-label="Descrição"
              onChange={(e) => update((d) => void (d.pillars[i].desc = e.target.value))}
            />
            <div className="lbl">Sub-pilares · {p.subs.length}</div>
            {p.subs.length > 0 && (
              <div className="tags">
                {p.subs.map((x, j) => (
                  <span className="sub" key={x + j}>
                    {x}
                    <button aria-label={`Remover ${x}`} onClick={() => update((d) => void d.pillars[i].subs.splice(j, 1))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <input
              className="input"
              placeholder="Adicionar (Enter)"
              aria-label="Novo sub-pilar"
              value={subDraft[p.id] ?? ""}
              onChange={(e) => setSubDraft({ ...subDraft, [p.id]: e.target.value })}
              onKeyDown={(e) => {
                const v = (subDraft[p.id] ?? "").trim();
                if (e.key !== "Enter" || !v) return;
                update((d) => { if (!d.pillars[i].subs.includes(v)) d.pillars[i].subs.push(v); });
                setSubDraft({ ...subDraft, [p.id]: "" });
              }}
            />
            <div className="row">
              <button className="btn" onClick={() => gen(p.id)} disabled={busy !== null}>
                {busy === p.id ? <><span className="spin" />Gerando…</> : "Gerar sub-pilares"}
              </button>
              <input
                type="number"
                className="input"
                style={{ width: 60 }}
                min={1}
                max={15}
                value={p.genN ?? 5}
                aria-label="Quantidade"
                onChange={(e) => update((d) => void (d.pillars[i].genN = Math.max(1, Math.min(15, parseInt(e.target.value, 10) || 5))))}
              />
              <button className="btn ghost danger" style={{ marginLeft: "auto" }} onClick={() => update((d) => void d.pillars.splice(i, 1))}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
