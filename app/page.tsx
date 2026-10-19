"use client";

import { useState } from "react";
import { StoreProvider, useStore } from "../lib/store";
import { PROVIDERS } from "../lib/models";
import { Toast } from "../components/ui";
import { GerarView } from "../components/GerarView";
import { TemplatesView } from "../components/TemplatesView";
import { PilaresView } from "../components/PilaresView";
import { PublicoView } from "../components/PublicoView";
import { StyleView } from "../components/StyleView";
import { ConfigView } from "../components/ConfigView";

type View = "gerar" | "templates" | "pilares" | "publico" | "style" | "config";

function Shell() {
  const { s, ready, templates } = useStore();
  const [view, setView] = useState<View>("gerar");
  if (!ready) return null;

  const prov = PROVIDERS.find((p) => p.id === s.llm.provider)!;
  const model = s.llm.model[s.llm.provider];
  const items: [View, string, number | null][] = [
    ["gerar", "Gerar", null],
    ["templates", "Templates", templates.length - s.tplOff.length],
    ["pilares", "Pilares", s.pillars.length],
    ["publico", "Público", s.audience.length],
    ["style", "Style", s.samples.length + s.rules.length],
  ];

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="logo">E</span>Estúdio de Posts
        </div>
        {items.map(([id, label, n]) => (
          <button key={id} className="nav" aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}>
            {label}
            {n != null && <span className="count">{n}</span>}
          </button>
        ))}
        <div className="spacer" />
        <button className="nav" aria-current={view === "config" ? "page" : undefined} onClick={() => setView("config")} title="Configurações">
          Configurações
          <span className="count">{s.llm.keys[s.llm.provider] && model ? prov.name : "sem chave"}</span>
        </button>
      </aside>
      <main className="main">
        <div className="page">
          {view === "gerar" && <GerarView goConfig={() => setView("config")} />}
          {view === "templates" && <TemplatesView />}
          {view === "pilares" && <PilaresView goConfig={() => setView("config")} />}
          {view === "publico" && <PublicoView />}
          {view === "style" && <StyleView />}
          {view === "config" && <ConfigView />}
        </div>
      </main>
      <Toast />
    </div>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
