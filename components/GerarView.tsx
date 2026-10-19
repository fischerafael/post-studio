"use client";

import { useState } from "react";
import { CATEGORIES } from "../lib/templates";
import { fullPostPrompt, suggestionsPrompt } from "../lib/prompts";
import { toggle, useStore } from "../lib/store";
import { drawSlots, rememberSubs } from "../lib/slots";
import { useLlm } from "../lib/useLlm";
import { PROVIDERS } from "../lib/models";
import type { RunInfo, Suggestion, Template } from "../lib/types";
import { TierPicker } from "./ModelPicker";
import { copyText, CatTag, Empty, Prop } from "./ui";

interface Raw {
  slot?: number;
  template_id?: string;
  hook?: string;
  angulo?: string;
  rascunho?: string;
}

const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Texto copiado: post completo, ou gancho + rascunho (sem repetir o gancho), sempre terminando no CTA. */
function copyBody(r: Suggestion, cta?: string) {
  const draft = r.draft.trim();
  const opensWithHook = !!r.hook && norm(draft).startsWith(norm(r.hook));
  const body = (r.full || (opensWithHook || !draft ? draft || r.hook : `${r.hook}\n\n${draft}`)).trimEnd();
  const c = cta?.trim();
  return c && !body.endsWith(c) ? `${body}\n\n${c}` : body;
}

function RunParams({ r }: { r: RunInfo }) {
  const prov = PROVIDERS.find((p) => p.id === r.provider)?.name ?? r.provider;
  const rows: [string, string][] = [
    ["Gerado em", new Date(r.at).toLocaleString("pt-BR")],
    ["Modelo", `${prov} · ${r.model}`],
    ["Sugestões", String(r.n)],
    ["Formatos", r.formats.join(", ")],
    ["Pilar", r.pillar],
    ["Categorias", `${r.cats.join(", ") || "—"}${r.onlyFav ? " (só favoritos)" : ""}`],
    ["Templates no sorteio", String(r.pool)],
    ["Idioma", r.lang],
    ["Instrução extra", r.extra || "—"],
    ["Estilo", `${r.samples} samples, ${r.rules} regras`],
  ];
  return (
    <details>
      <summary>Parâmetros desta geração</summary>
      <div className="props" style={{ marginTop: 8 }}>
        {rows.map(([k, v]) => (
          <Prop key={k} k={k}><span className="small">{v}</span></Prop>
        ))}
      </div>
    </details>
  );
}

export function GerarView({ goConfig }: { goConfig: () => void }) {
  const { s, update, templates, textOf } = useStore();
  const llm = useLlm();
  const g = s.settings;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [busyFull, setBusyFull] = useState<number | null>(null);
  const [newFmt, setNewFmt] = useState("");

  const pool = templates.filter((t) => !s.tplOff.includes(t.id) && g.cats.includes(t.cat) && (!g.onlyFav || s.tplFav.includes(t.id)));

  async function generate() {
    setErr("");
    if (!pool.length) return setErr("Nenhum template ativo com esses filtros. Ative categorias ou templates.");
    if (!g.formats.length) return setErr("Marque ao menos um formato.");
    setBusy(true);
    try {
      const slots = drawSlots(s, pool.map((t: Template) => ({ t, text: textOf(t) })));
      const out = await llm.json<Raw[] | { sugestoes?: Raw[] }>(suggestionsPrompt(s, slots), 6000);
      const arr = Array.isArray(out) ? out : out.sugestoes ?? [];
      const byId = new Map(templates.map((t) => [t.id, t]));
      const results: Suggestion[] = arr.slice(0, g.n).map((r, i) => {
        const x = slots[(r.slot ?? i + 1) - 1] ?? slots[i];
        return {
          tid: r.template_id ?? "",
          cat: byId.get(r.template_id ?? "")?.cat ?? "custom",
          pillar: x.pillar?.name ?? "",
          sub: x.sub,
          format: x.format,
          persona: x.persona?.name ?? "",
          hook: r.hook ?? "",
          angle: r.angulo ?? "",
          draft: r.rascunho ?? "",
          full: "",
        };
      });
      if (!results.length) throw new Error("O modelo não devolveu sugestões. Tente de novo.");
      const info: RunInfo = {
        at: Date.now(),
        provider: llm.provider,
        model: llm.modelId,
        n: g.n,
        formats: g.formats,
        pillar: g.pillar === "all" ? "Todos" : s.pillars.find((p) => p.id === g.pillar)?.name ?? "Todos",
        cats: CATEGORIES.filter((c) => g.cats.includes(c.id)).map((c) => c.name),
        onlyFav: g.onlyFav,
        lang: g.lang,
        extra: g.extra,
        pool: pool.length,
        samples: Math.min(s.samples.length, 8),
        rules: s.rules.length,
      };
      update((d) => {
        d.results = results;
        d.recentSubs = rememberSubs(d, slots);
        d.lastRun = info;
      });
    } catch (e) {
      setErr(e instanceof SyntaxError ? "A resposta veio fora do formato. Tente de novo ou use um modelo maior." : (e as Error).message);
    }
    setBusy(false);
  }

  async function writeFull(i: number) {
    setBusyFull(i);
    try {
      const body = (await llm.text(fullPostPrompt(s, s.results[i]), 4096)).trimEnd();
      const full = s.cta?.trim() ? `${body}\n\n${s.cta.trim()}` : body;
      update((d) => void (d.results[i].full = full));
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusyFull(null);
  }

  return (
    <>
      <h1>Gerar</h1>
      <p className="lead">Escolha quantas sugestões quer e gere. Cada uma sai de um template seu, preenchido com seus pilares e seu público.</p>

      <div className="props">
        <Prop k="Modelo"><TierPicker /></Prop>
        <Prop k="Sugestões" row>
          <div className="seg">
            <button onClick={() => update((d) => void (d.settings.n = Math.max(1, d.settings.n - 1)))} aria-label="Menos">−</button>
            <button disabled style={{ opacity: 1, color: "var(--fg)", minWidth: 40 }}>{g.n}</button>
            <button onClick={() => update((d) => void (d.settings.n = Math.min(10, d.settings.n + 1)))} aria-label="Mais">+</button>
          </div>
        </Prop>
        <Prop k="Formatos">
          <div className="tags">
            {g.allFormats.map((f) => (
              <button key={f} className="tag blue" aria-pressed={g.formats.includes(f)} onClick={() => update((d) => toggle(d.settings.formats, f))}>
                {f}
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="Outro formato (Enter)"
            value={newFmt}
            onChange={(e) => setNewFmt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || !newFmt.trim()) return;
              const f = newFmt.trim();
              update((d) => {
                if (!d.settings.allFormats.includes(f)) d.settings.allFormats.push(f);
                if (!d.settings.formats.includes(f)) d.settings.formats.push(f);
              });
              setNewFmt("");
            }}
            aria-label="Novo formato"
          />
        </Prop>
        <Prop k="Pilar">
          <select className="select" value={g.pillar} onChange={(e) => update((d) => void (d.settings.pillar = e.target.value))} aria-label="Pilar">
            <option value="all">Todos</option>
            {s.pillars.map((p) => (
              <option key={p.id} value={p.id}>{p.name || "(sem nome)"}</option>
            ))}
          </select>
        </Prop>
        <Prop k="Categorias">
          <div className="tags">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={"tag " + c.color} aria-pressed={g.cats.includes(c.id)} onClick={() => update((d) => toggle(d.settings.cats, c.id))}>
                {c.name}
              </button>
            ))}
          </div>
          <label className="row small muted">
            <input type="checkbox" className="switch" checked={g.onlyFav} onChange={(e) => update((d) => void (d.settings.onlyFav = e.target.checked))} />
            Só favoritos
          </label>
        </Prop>
        <Prop k="Idioma">
          <input className="input" value={g.lang} onChange={(e) => update((d) => void (d.settings.lang = e.target.value))} aria-label="Idioma" />
        </Prop>
        <Prop k="Instrução extra">
          <textarea className="area" value={g.extra} placeholder="Ex.: foco em IA aplicada a finanças; tom mais direto" onChange={(e) => update((d) => void (d.settings.extra = e.target.value))} aria-label="Instrução extra" />
        </Prop>
      </div>

      <div className="row">
        <button className="btn pri" onClick={generate} disabled={busy || !llm.ready}>
          {busy ? <><span className="spin" />Gerando…</> : "Gerar sugestões"}
        </button>
        <span className="small muted">{pool.length} templates no sorteio</span>
        {!llm.ready && (
          <button className="btn ghost" onClick={goConfig}>Adicionar chave e modelo</button>
        )}
      </div>
      {err && <p className="err" style={{ marginTop: 12 }}>{err}</p>}

      <div style={{ marginTop: 32 }}>
        {!s.results.length && !busy && (
          <Empty title="Nada gerado ainda">As sugestões aparecem aqui, com gancho, formato, ângulo e rascunho.</Empty>
        )}
        {s.results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            <div className="row">
              <button className="btn" onClick={generate} disabled={busy || !llm.ready}>
                {busy ? <><span className="spin" />Gerando…</> : "Regenerar"}
              </button>
              <span className="small muted">Sorteia novos templates com os parâmetros atuais e substitui estas sugestões.</span>
            </div>
            {s.lastRun && <RunParams r={s.lastRun} />}
          </div>
        )}
        {s.results.map((r, i) => (
          <article className="sug" key={i} style={{ opacity: busy ? 0.5 : 1 }}>
            <div className="meta">
              <CatTag id={r.cat} />
              {r.format && <span className="tag gray">{r.format}</span>}
              <span>{r.pillar}{r.sub ? ` › ${r.sub}` : ""}</span>
              {r.persona && <span>· para {r.persona}</span>}
            </div>
            <div className="hook">{r.hook}</div>
            {r.angle && <p className="muted">{r.angle}</p>}
            {r.draft && <div className="callout pre">{r.draft}</div>}
            {r.full && <div className="callout pre">{r.full}</div>}
            <div className="row">
              <button className="btn" onClick={() => copyText(copyBody(r, s.cta))}>Copiar</button>
              <button className="btn" onClick={() => writeFull(i)} disabled={busyFull !== null}>
                {busyFull === i ? <><span className="spin" />Escrevendo…</> : "Escrever post completo"}
              </button>
              <button className="btn ghost danger" onClick={() => update((d) => void d.results.splice(i, 1))}>Descartar</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

