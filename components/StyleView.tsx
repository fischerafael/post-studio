"use client";

import { useState } from "react";
import { useStore } from "../lib/store";
import { Empty } from "./ui";
import { SamplesView } from "./SamplesView";

function RulesTab() {
  const { s, update } = useStore();
  const [text, setText] = useState("");

  function add() {
    const t = text.trim();
    if (!t) return;
    update((d) => void d.rules.push(t));
    setText("");
  }

  return (
    <>
      <p className="lead">Regras curtas que o gerador sempre segue. Ex.: “não use letras maiúsculas”, “evite a palavra ‘jornada’”, “sem construção ‘não é X, é Y’”.</p>
      <div className="row">
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Nova regra (Enter)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="Nova regra"
        />
        <button className="btn pri" onClick={add}>Adicionar</button>
      </div>
      <hr />
      {!s.rules.length && <Empty title="Nenhuma regra ainda">Cada regra vira um bullet no prompt, tanto nas sugestões quanto no post completo.</Empty>}
      <div className="cards">
        {s.rules.map((r, i) => (
          <div className="card" key={i}>
            <div className="row">
              <input
                className="input"
                style={{ flex: 1 }}
                value={r}
                aria-label="Regra"
                onChange={(e) => update((d) => void (d.rules[i] = e.target.value))}
                onBlur={() => !r.trim() && update((d) => void d.rules.splice(i, 1))}
              />
              <button className="btn ghost danger" onClick={() => update((d) => void d.rules.splice(i, 1))}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function StyleView() {
  const { s } = useStore();
  const [tab, setTab] = useState<"samples" | "rules">("samples");
  return (
    <>
      <h1>Style</h1>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button aria-pressed={tab === "samples"} onClick={() => setTab("samples")}>Samples ({s.samples.length})</button>
        <button aria-pressed={tab === "rules"} onClick={() => setTab("rules")}>Rules ({s.rules.length})</button>
      </div>
      {tab === "samples" ? <SamplesView /> : <RulesTab />}
    </>
  );
}
