"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CATEGORIES } from "../lib/templates";

let listener: ((m: string) => void) | null = null;
export function toast(msg: string) {
  listener?.(msg);
}
export function Toast() {
  const [m, setM] = useState("");
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    listener = (msg) => {
      setM(msg);
      clearTimeout(t);
      t = setTimeout(() => setM(""), 2200);
    };
    return () => {
      listener = null;
      clearTimeout(t);
    };
  }, []);
  return m ? <div className="toast" role="status">{m}</div> : null;
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copiado");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast("Copiado");
    } catch {
      toast("Não foi possível copiar");
    }
    ta.remove();
  }
}

export function Prop({ k, children, row }: { k: string; children: ReactNode; row?: boolean }) {
  return (
    <div className="prop">
      <div className="k">{k}</div>
      <div className={"v" + (row ? " row" : "")}>{children}</div>
    </div>
  );
}

export function CatTag({ id }: { id: string }) {
  const c = CATEGORIES.find((x) => x.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
  return <span className={"tag " + c.color}>{c.name}</span>;
}

/** Texto de template com as lacunas [entre colchetes] destacadas. */
export function TemplateText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("[") && p.endsWith("]") ? (
          <span key={i} className="ph">{p.slice(1, -1)}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {children}
    </div>
  );
}
