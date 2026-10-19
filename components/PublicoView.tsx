"use client";

import { uid, useStore } from "../lib/store";
import { Empty } from "./ui";

export function PublicoView() {
  const { s, update } = useStore();
  return (
    <>
      <h1>Público</h1>
      <p className="lead">Quem você quer alcançar e o que quer que cada pessoa sinta ou faça depois de ler.</p>

      <h2 style={{ marginTop: 0 }}>Sobre você</h2>
      <textarea className="area" value={s.bio} aria-label="Sobre você" onChange={(e) => update((d) => void (d.bio = e.target.value))} />

      <div className="row" style={{ margin: "32px 0 12px", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Personas</h2>
        <button className="btn pri" onClick={() => update((d) => void d.audience.push({ id: uid(), name: "Nova persona", desc: "", goal: "" }))}>Nova persona</button>
      </div>
      {!s.audience.length && <Empty title="Nenhuma persona ainda">Adicione ao menos um público-alvo.</Empty>}
      <div className="cards">
        {s.audience.map((a, i) => (
          <div className="card" key={a.id}>
            <input className="input" style={{ fontWeight: 600 }} value={a.name} aria-label="Nome" onChange={(e) => update((d) => void (d.audience[i].name = e.target.value))} />
            <div className="lbl">Quem é</div>
            <textarea className="area" value={a.desc} aria-label="Quem é" onChange={(e) => update((d) => void (d.audience[i].desc = e.target.value))} />
            <div className="lbl">Objetivo com essa pessoa</div>
            <textarea className="area" value={a.goal} aria-label="Objetivo" onChange={(e) => update((d) => void (d.audience[i].goal = e.target.value))} />
            <div className="row">
              <button className="btn ghost danger" style={{ marginLeft: "auto" }} onClick={() => update((d) => void d.audience.splice(i, 1))}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
