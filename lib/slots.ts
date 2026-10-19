import type { Persona, Pillar, State, Template } from "./types";

export interface Slot {
  pillar: Pillar | null;
  sub: string;
  persona: Persona | null;
  format: string;
  tpls: { t: Template; text: string }[];
}

const TPLS_PER_SLOT = 6;
const RECENT_MAX = 40;

export function shuffle<T>(a: T[]) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Sorteia em ciclos embaralhados: só repete um item depois de usar todos. */
function cycler<T>(items: T[]) {
  let bag: T[] = [];
  return () => {
    if (!bag.length) bag = shuffle(items);
    return bag.pop() as T;
  };
}

export const subKey = (p: Pillar, sub: string) => `${p.id}|${sub}`;

/** Um slot por sugestão: pilar, sub-pilar, persona, formato e templates sorteados no código. */
export function drawSlots(s: State, pool: { t: Template; text: string }[]): Slot[] {
  const g = s.settings;
  const pillars = g.pillar === "all" ? s.pillars : s.pillars.filter((p) => p.id === g.pillar);
  const nextPillar = pillars.length ? cycler(pillars) : () => null;
  const nextPersona = s.audience.length ? cycler(s.audience) : () => null;
  const nextFormat = cycler(g.formats);
  const tpls = shuffle(pool);
  const usedNow = new Set<string>();
  const recent = new Set(s.recentSubs ?? []);

  return Array.from({ length: g.n }, (_, i) => {
    const pillar = nextPillar();
    let sub = "";
    if (pillar?.subs.length) {
      const free = pillar.subs.filter((x) => !usedNow.has(subKey(pillar, x)));
      const fresh = free.filter((x) => !recent.has(subKey(pillar, x)));
      const from = fresh.length ? fresh : free.length ? free : pillar.subs;
      sub = from[Math.floor(Math.random() * from.length)];
      usedNow.add(subKey(pillar, sub));
    }
    const mine = Array.from({ length: Math.min(TPLS_PER_SLOT, tpls.length) }, (_, k) => tpls[(i * TPLS_PER_SLOT + k) % tpls.length]);
    return { pillar, sub, persona: nextPersona(), format: nextFormat(), tpls: mine };
  });
}

export function rememberSubs(s: State, slots: Slot[]) {
  const keys = slots.filter((x) => x.pillar && x.sub).map((x) => subKey(x.pillar!, x.sub));
  return [...keys, ...(s.recentSubs ?? []).filter((k) => !keys.includes(k))].slice(0, RECENT_MAX);
}
