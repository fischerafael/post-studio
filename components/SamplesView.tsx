"use client";

import { useState } from "react";
import { uid, useStore } from "../lib/store";
import { Empty, Prop, toast } from "./ui";

export function SamplesView() {
  const { s, update } = useStore();
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [format, setFormat] = useState("");

  return (
    <>
      <p className="lead">Cole posts seus que funcionaram. O gerador usa os 8 primeiros para imitar tom, ritmo e estrutura.</p>

      <div className="props">
        <Prop k="Observação">
          <input className="input" placeholder="Ex.: 200 mil impressões" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Observação" />
        </Prop>
        <Prop k="Formato">
          <select className="select" value={format} onChange={(e) => setFormat(e.target.value)} aria-label="Formato">
            <option value="">—</option>
            {s.settings.allFormats.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Prop>
        <Prop k="Texto">
          <textarea className="area" style={{ minHeight: 140 }} value={text} onChange={(e) => setText(e.target.value)} aria-label="Texto do post" />
        </Prop>
      </div>
      <button
        className="btn pri"
        onClick={() => {
          const t = text.trim();
          if (!t) return toast("Cole o texto do post");
          update((d) => void d.samples.unshift({ id: uid(), text: t, note: note.trim(), format }));
          setText(""); setNote(""); setFormat("");
        }}
      >
        Salvar sample
      </button>

      <hr />
      {!s.samples.length && (
        <Empty title="Nenhum sample ainda">Sem samples, o gerador usa só bio, pilares e público. Com 3 a 8 posts seus o resultado fica mais parecido com você.</Empty>
      )}
      <div className="cards">
        {s.samples.map((x, i) => (
          <div className="card" key={x.id}>
            <div className="row">
              {x.format && <span className="tag gray">{x.format}</span>}
              {x.note && <span className="small muted">{x.note}</span>}
              <button className="btn ghost danger" style={{ marginLeft: "auto" }} onClick={() => update((d) => void d.samples.splice(i, 1))}>Remover</button>
            </div>
            <textarea className="area" style={{ minHeight: 160 }} value={x.text} aria-label="Texto do sample" onChange={(e) => update((d) => void (d.samples[i].text = e.target.value))} />
          </div>
        ))}
      </div>
    </>
  );
}
