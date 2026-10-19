"use client";

import { useState } from "react";
import { fetchModels, pickTiers, PROVIDERS, TIERS, tierOf } from "../lib/models";
import { useStore } from "../lib/store";
import type { Provider } from "../lib/types";
import { Prop } from "./ui";

export function ConfigView() {
  const { s, update } = useStore();
  const p = s.llm.provider;
  const info = PROVIDERS.find((x) => x.id === p)!;
  const cache = s.llm.cache[p];
  const items = cache?.items ?? [];
  const picks = pickTiers(p, items);
  const active = tierOf(p, items, s.llm.model[p]);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function connect() {
    const key = s.llm.keys[p].trim();
    if (!key) return setMsg({ ok: false, text: "Cole a chave primeiro." });
    setBusy(true);
    setMsg(null);
    try {
      const list = await fetchModels(p, key);
      const t = pickTiers(p, list);
      update((d) => {
        d.llm.keys[p] = key;
        d.llm.cache[p] = { at: Date.now(), items: list };
        const cur = d.llm.model[p];
        if (!cur || !list.some((m) => m.id === cur)) d.llm.model[p] = (t.medium ?? t.small ?? t.large ?? list[0])?.id ?? "";
      });
      setMsg({ ok: true, text: `${list.length} modelos encontrados.` });
    } catch (e) {
      const text = e instanceof TypeError ? "Não consegui falar com o provedor. Verifique a conexão." : (e as Error).message;
      setMsg({ ok: false, text });
    }
    setBusy(false);
  }

  const ago = cache ? Math.max(1, Math.round((Date.now() - cache.at) / 60000)) : 0;

  return (
    <>
      <h1>Configurações</h1>
      <p className="lead">Use a sua própria chave. Ela fica salva só neste navegador e as chamadas vão direto do navegador para o provedor.</p>

      <div className="props">
        <Prop k="Provedor">
          <div className="seg" role="group" aria-label="Provedor">
            {PROVIDERS.map((x) => (
              <button
                key={x.id}
                aria-pressed={p === x.id}
                onClick={() => {
                  setMsg(null);
                  update((d) => void (d.llm.provider = x.id as Provider));
                }}
              >
                {x.name}
              </button>
            ))}
          </div>
        </Prop>
        <Prop k="Chave de API">
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input
              className="input mono"
              type={show ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder={info.keyHint}
              value={s.llm.keys[p]}
              onChange={(e) => update((d) => void (d.llm.keys[p] = e.target.value))}
              aria-label="Chave de API"
            />
            <button className="btn" onClick={() => setShow(!show)}>{show ? "Ocultar" : "Mostrar"}</button>
          </div>
          <div className="row">
            <button className="btn pri" onClick={connect} disabled={busy}>
              {busy ? <><span className="spin" />Conectando…</> : cache ? "Atualizar modelos" : "Conectar"}
            </button>
            <a className="small muted" href={info.keyUrl} target="_blank" rel="noreferrer">Criar uma chave</a>
            {s.llm.keys[p] && (
              <button className="btn ghost danger" onClick={() => update((d) => { d.llm.keys[p] = ""; delete d.llm.cache[p]; d.llm.model[p] = ""; })}>
                Remover chave
              </button>
            )}
          </div>
          {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
        </Prop>
      </div>

      <h2>CTA padrão</h2>
      <div className="props">
        <Prop k="Texto">
          <textarea
            className="area"
            value={s.cta ?? ""}
            placeholder="Ex.: Me segue para mais posts sobre engenharia de software e IA."
            onChange={(e) => update((d) => void (d.cta = e.target.value))}
            aria-label="CTA padrão"
          />
          <p className="small muted">Anexado, sem alterações, ao fim de todo post gerado. Deixe vazio para não usar.</p>
        </Prop>
      </div>

      <h2>Modelo</h2>
      {!cache ? (
        <p className="muted">Conecte a chave para ver os modelos atuais de {info.name}.</p>
      ) : (
        <>
          <div className="props">
            {TIERS.map((t) => {
              const m = picks[t.id];
              return (
                <Prop key={t.id} k={t.label}>
                  <label className="row" style={{ flexWrap: "nowrap", gap: 10 }}>
                    <input type="radio" name="tier" disabled={!m} checked={active === t.id} onChange={() => m && update((d) => void (d.llm.model[p] = m.id))} />
                    <span>{m ? m.name : "não encontrado"}</span>
                    <span className="small muted">{t.hint}</span>
                  </label>
                </Prop>
              );
            })}
            <Prop k="Outro">
              <select
                className="select"
                aria-label="Outro modelo"
                value={s.llm.model[p]}
                onChange={(e) => update((d) => void (d.llm.model[p] = e.target.value))}
              >
                {items.map((m) => (
                  <option key={m.id} value={m.id}>{m.id}</option>
                ))}
              </select>
            </Prop>
          </div>
          <p className="small muted">Lista buscada há {ago} min. Os três atalhos usam a versão mais nova de cada faixa que o provedor devolveu.</p>
        </>
      )}
    </>
  );
}
