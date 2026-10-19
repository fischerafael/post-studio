import { CATEGORIES } from "./templates";
import type { Slot } from "./slots";
import type { Pillar, State } from "./types";

const catName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? id;

export const SYSTEM =
  "Você é um estrategista de conteúdo experiente. Escreve com voz humana, direta e específica, sem clichês de IA. Siga exatamente o formato de saída pedido.";

function pillarLine(p: Pillar) {
  return `- ${p.name}${p.desc ? ` (${p.desc})` : ""}${p.subs.length ? `. Sub-pilares: ${p.subs.join("; ")}` : ""}`;
}

export function audienceBlock(s: State) {
  return s.audience.map((a) => `- ${a.name}: ${a.desc} Objetivo: ${a.goal}`).join("\n") || "(nenhum cadastrado)";
}

export function samplesBlock(s: State) {
  return (
    s.samples
      .slice(0, 8)
      .map((x, i) => `--- Sample ${i + 1}${x.format ? ` [${x.format}]` : ""}${x.note ? ` (${x.note})` : ""}\n${x.text.slice(0, 900)}`)
      .join("\n") || "(nenhum cadastrado)"
  );
}

export function rulesBlock(s: State) {
  return s.rules.length ? `\nREGRAS DE ESTILO (obrigatórias, valem para todo texto que você escrever e prevalecem sobre qualquer padrão de tamanho ou formato abaixo):\n${s.rules.map((r) => `- ${r}`).join("\n")}\n` : "";
}

export function suggestionsPrompt(s: State, slots: Slot[]) {
  const g = s.settings;
  const slotBlock = slots
    .map((x, i) => {
      const head = [
        `Pilar: ${x.pillar ? pillarLine(x.pillar).slice(2) : "(livre)"}`,
        x.sub ? `Sub-pilar (obrigatório): ${x.sub}` : "Sub-pilar: escolha um tema específico e menos óbvio do pilar",
        `Persona: ${x.persona ? `${x.persona.name} (${x.persona.desc} Objetivo: ${x.persona.goal})` : "(livre)"}`,
        `Formato: ${x.format}`,
      ].join("\n");
      const list = x.tpls.map(({ t, text }) => `${t.id} | ${catName(t.cat)} | ${text}`).join("\n");
      return `### SLOT ${i + 1}
${head}
Templates (id | categoria | texto; termos entre [colchetes] são lacunas a preencher). Escolha UM:
${list}`;
    })
    .join("\n\n");
  return `Gere ${g.n} sugestões de posts distintas, uma para cada SLOT abaixo. Pilar, sub-pilar, persona e formato de cada slot já foram sorteados: respeite-os exatamente.

SOBRE O AUTOR:
${s.bio}

POSTS DE REFERÊNCIA DO AUTOR (imite voz, ritmo e estrutura; não copie trechos):
${samplesBlock(s)}
${rulesBlock(s)}
${slotBlock}

REGRAS:
- Em cada slot, escolha um dos templates listados nele e preencha as lacunas com assuntos concretos do pilar/sub-pilar, sem inventar fatos sobre a vida do autor. Cada slot deve tratar de um assunto diferente dos demais.
- Os templates podem estar em outro idioma (muitos estão em inglês). Traduza e adapte tudo para ${g.lang}: "hook", "post" e todos os campos de texto devem estar inteiramente em ${g.lang}, sem frases do template deixadas no idioma original.
- "hook" é o template já preenchido, traduzido para ${g.lang} e adaptado à voz do autor.
- "post" é o post COMPLETO, pronto para publicar, no formato do slot (carrossel: slide a slide; reel: roteiro com falas). Tamanho padrão do texto: 120 a 250 palavras, SOMENTE se as REGRAS DE ESTILO não definirem tamanho; se definirem (palavras, frases, parágrafos, caracteres, slides etc.), siga a regra e ignore o padrão. Ele precisa casar com o "hook": a primeira linha do post é o próprio hook ou responde diretamente a ele, de modo que o tema fique claro já na primeira frase. Não abra com uma frase genérica sem relação com o hook. O hook não é exibido separado do post: o texto precisa funcionar sozinho.
${s.cta?.trim() ? "- Um CTA fixo é anexado ao final automaticamente: não escreva CTA nem convite para ação no fim do post.\n" : ""}- Idioma de saída: ${g.lang}.
${g.extra ? `- Instrução extra: ${g.extra}
` : ""}
Responda SOMENTE com um array JSON de ${g.n} itens, na ordem dos slots, sem texto fora dele. Cada item:
{"slot":1,"template_id":"...","hook":"...","angulo":"uma ou duas frases sobre o que o post defende e por quê","post":"..."}`;
}

export function subsPrompt(s: State, p: Pillar, n: number) {
  return `Sugira ${n} sub-pilares de conteúdo para o pilar abaixo. Cada um deve ser um tema específico o bastante para render vários posts, com 2 a 6 palavras, em português do Brasil.

Autor: ${s.bio}
Pilar: ${p.name}${p.desc ? ` (${p.desc})` : ""}
Público:
${audienceBlock(s)}
Já existentes (não repita): ${p.subs.join("; ") || "nenhum"}

Responda SOMENTE com um array JSON de strings.`;
}
