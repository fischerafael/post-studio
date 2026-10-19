"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "../lib/templates";
import { toggle, uid, useStore } from "../lib/store";
import { CatTag, Empty, TemplateText, toast } from "./ui";

export function TemplatesView() {
  const { s, update, templates, textOf } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [favOnly, setFavOnly] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState("custom");
  const [newText, setNewText] = useState("");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return templates.filter((t) => {
      if (cat !== "all" && t.cat !== cat) return false;
      if (favOnly && !s.tplFav.includes(t.id)) return false;
      return !needle || textOf(t).toLowerCase().includes(needle);
    });
  }, [templates, q, cat, favOnly, s.tplFav, textOf]);

  function save(id: string, builtin: boolean, original: string) {
    const v = draft.trim();
    if (!v) return toast("O texto não pode ficar vazio");
    update((d) => {
      if (builtin) {
        if (v === original) delete d.tplOver[id];
        else d.tplOver[id] = v;
      } else {
        const c = d.tplCustom.find((x) => x.id === id);
        if (c) c.text = v;
      }
    });
    setEditing(null);
  }

  return (
    <>
      <h1>Templates</h1>
      <p className="lead">Os 200 padrões, mais os seus. Clique no texto para editar. Termos entre [colchetes] são as lacunas.</p>

      <div className="row" style={{ marginBottom: 12 }}>
        <input className="input" style={{ flex: "1 1 220px", width: "auto" }} placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar template" />
        <button className="btn" onClick={() => setFavOnly(!favOnly)} aria-pressed={favOnly}>{favOnly ? "★ Favoritos" : "☆ Favoritos"}</button>
        <button className="btn pri" onClick={() => setAdding(true)}>Novo</button>
      </div>
      <div className="tags" style={{ marginBottom: 8 }}>
        <button className="tag gray" aria-pressed={cat === "all"} onClick={() => setCat("all")}>Todas</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={"tag " + c.color} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</button>
        ))}
      </div>

      {adding && (
        <div className="callout" style={{ margin: "16px 0" }}>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <select className="select" style={{ width: 180, flex: "none" }} value={newCat} onChange={(e) => setNewCat(e.target.value)} aria-label="Categoria">
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input" autoFocus placeholder="Ex.: O erro de [tema] que eu cometi" value={newText} onChange={(e) => setNewText(e.target.value)} aria-label="Texto do template" />
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button
              className="btn pri"
              onClick={() => {
                const v = newText.trim();
                if (!v) return toast("Escreva o texto");
                update((d) => void d.tplCustom.push({ id: "c" + uid(), cat: newCat, text: v }));
                setNewText("");
                setAdding(false);
              }}
            >
              Adicionar
            </button>
            <button className="btn ghost" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {!list.length && <Empty title="Nenhum template encontrado">Ajuste a busca ou o filtro.</Empty>}

      {CATEGORIES.map((c) => {
        const items = list.filter((t) => t.cat === c.id);
        if (!items.length) return null;
        const allOn = items.every((t) => !s.tplOff.includes(t.id));
        return (
          <section key={c.id}>
            <div className="cat-h">
              <CatTag id={c.id} />
              <span className="tip">{c.tip}</span>
              <button
                className="btn ghost small"
                onClick={() =>
                  update((d) =>
                    items.forEach((t) => {
                      const i = d.tplOff.indexOf(t.id);
                      if (allOn && i < 0) d.tplOff.push(t.id);
                      if (!allOn && i >= 0) d.tplOff.splice(i, 1);
                    })
                  )
                }
              >
                {allOn ? "Desativar todos" : "Ativar todos"}
              </button>
            </div>
            {items.map((t) => {
              const off = s.tplOff.includes(t.id);
              const fav = s.tplFav.includes(t.id);
              const text = textOf(t);
              const edited = t.builtin && !!s.tplOver[t.id];
              return (
                <div key={t.id} className={"tpl" + (off ? " off" : "")}>
                  <span className="n">{t.num ?? "+"}</span>
                  {editing === t.id ? (
                    <div className="edit">
                      <input
                        className="input"
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") save(t.id, t.builtin, t.text);
                          if (e.key === "Escape") setEditing(null);
                        }}
                        aria-label="Editar template"
                      />
                      <button className="btn pri" onClick={() => save(t.id, t.builtin, t.text)}>Salvar</button>
                      <button className="btn ghost" onClick={() => setEditing(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="t"
                        role="button"
                        tabIndex={0}
                        onClick={() => { setEditing(t.id); setDraft(text); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { setEditing(t.id); setDraft(text); } }}
                      >
                        <TemplateText text={text} />
                        {edited && <span className="small muted"> · editado</span>}
                      </div>
                      <div className={"a" + (fav ? " on" : "")}>
                        <button className={"ic" + (fav ? " star" : "")} aria-label="Favorito" onClick={() => update((d) => toggle(d.tplFav, t.id))}>{fav ? "★" : "☆"}</button>
                        {edited && <button className="ic" aria-label="Restaurar padrão" title="Restaurar padrão" onClick={() => update((d) => void delete d.tplOver[t.id])}>↺</button>}
                        {!t.builtin && <button className="ic" aria-label="Excluir" onClick={() => update((d) => void (d.tplCustom = d.tplCustom.filter((x) => x.id !== t.id)))}>✕</button>}
                        <input type="checkbox" className="switch" checked={!off} aria-label="Ativo" onChange={() => update((d) => toggle(d.tplOff, t.id))} style={{ marginLeft: 6 }} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
