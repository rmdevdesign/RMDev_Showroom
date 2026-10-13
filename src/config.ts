export const finishes = [
  { id: "oak", name: "Chêne clair", color: "#dac097" },
  { id: "walnut", name: "Noyer naturel", color: "#b2916e" },
  { id: "chalk", name: "Craie", color: "#e4e0d5" },
  { id: "forest", name: "Forêt", color: "#39564a" },
  { id: "ink", name: "Encre", color: "#303d49" },
] as const;
export const frontFinishes = [
  { id: "chalk", name: "Craie", color: "#e8e5dc" },
  { id: "forest", name: "Forêt", color: "#39564a" },
  { id: "ink", name: "Encre", color: "#303d49" },
  { id: "clay", name: "Terracotta", color: "#b47762" },
  { id: "blue", name: "Bleu grisé", color: "#7e919b" },
] as const;
export const FOOT_HEIGHT_CM = 8;
export const feetFinishes = [
  { id: "graphite", name: "Graphite", color: "#343839" },
  { id: "aluminium", name: "Aluminium", color: "#b6b9b8" },
  { id: "chalk", name: "Craie", color: "#e8e5dc" },
  { id: "bronze", name: "Bronze", color: "#8f785b" },
] as const;
export const propTypes = [
  { id: "books", name: "Livres" },
  { id: "vase", name: "Vase" },
  { id: "plant", name: "Plante" },
  { id: "box", name: "Boîte" },
] as const;
export type PropType = (typeof propTypes)[number]["id"];
export type Placement = { type: PropType; color: string };
export const propColors = [
  { name: "Terre cuite", color: "#a76b51" },
  { name: "Écru", color: "#d5cdbb" },
  { name: "Anthracite", color: "#454844" },
];
// Seeded distribution changes with the furniture format, not with material choices.
export function placements(c: Config): Record<string, Placement> {
  if (!c.decor) return {};
  let seed = c.columns * 1297 + c.rows * 427 + (c.doors ? 137 : 0);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const slots: string[] = [];
  for (let row = c.doors ? 1 : 0; row < c.rows; row++)
    for (let col = 0; col < c.columns; col++) slots.push(col + ":" + row);
  const count = Math.min(
    slots.length,
    Math.max(2, Math.min(6, Math.round(slots.length * 0.4))),
  );
  const result: Record<string, Placement> = {};
  // Styling anchors distribute visual weight across the full cabinet.
  // Mirroring changes the composition between formats without clustering the props.
  const mirror = random() > 0.5;
  const anchors: [PropType, number, number][] = [
    ["plant", 0.15, 0.85],
    ["books", 0.85, 0.15],
    ["plant", 0.85, 0.55],
    ["vase", 0.15, 0.45],
    ["plant", 0.45, 0.15],
    ["box", 0.5, 0.8],
  ];
  const firstRow = c.doors ? 1 : 0,
    openRows = c.rows - firstRow;
  for (let i = 0; i < count; i++) {
    const [type, anchorX, anchorY] = anchors[i];
    const targetX = mirror ? 1 - anchorX : anchorX;
    let best = "",
      bestScore = Infinity;
    for (const key of slots) {
      if (result[key]) continue;
      const [col, row] = key.split(":").map(Number);
      const x = (col + 0.5) / c.columns,
        y = (row - firstRow + 0.5) / openRows;
      let score = (x - targetX) ** 2 + (y - anchorY) ** 2;
      for (const [otherKey, other] of Object.entries(result)) {
        const [ox, oy] = otherKey.split(":").map(Number);
        if (
          other.type === type &&
          Math.abs(col - ox) + Math.abs(row - oy) === 1
        )
          score += 0.3;
      }
      score += random() * 0.005;
      if (score < bestScore) {
        best = key;
        bestScore = score;
      }
    }
    const colors =
      type === "plant" || type === "vase" ? propColors.slice(0, 2) : propColors;
    result[best] = {
      type,
      color: colors[(i + c.columns + c.rows) % colors.length].color,
    };
  }
  return result;
}
export type Config = {
  columns: number;
  rows: number;
  finish: string;
  front: string;
  doors: boolean;
  legs: boolean;
  decor: boolean;
  feet?: string;
  props?: Record<string, Placement>;
};
export const defaults: Config = {
  columns: 3,
  rows: 2,
  finish: "oak",
  front: "forest",
  doors: true,
  legs: true,
  decor: true,
};
export const storageKey = "rmdev-forme-showroom-v1";
export function isConfig(value: unknown): value is Config {
  if (!value || typeof value !== "object") return false;
  const c = value as Config;
  return (
    [2, 3, 4].includes(c.columns) &&
    [2, 3, 4].includes(c.rows) &&
    finishes.some((f) => f.id === c.finish) &&
    frontFinishes.some((f) => f.id === c.front) &&
    typeof c.doors === "boolean" &&
    typeof c.legs === "boolean" &&
    typeof c.decor === "boolean" &&
    (c.feet === undefined || feetFinishes.some((f) => f.id === c.feet)) &&
    (c.props === undefined ||
      (c.props !== null &&
        typeof c.props === "object" &&
        !Array.isArray(c.props) &&
        Object.keys(c.props).length <= 16 &&
        Object.entries(c.props).every(
          ([key, p]) =>
            /^[0-3]:[0-3]$/.test(key) &&
            p !== null &&
            typeof p === "object" &&
            propTypes.some((t) => t.id === p.type) &&
            /^#[0-9a-fA-F]{6}$/.test(p.color),
        )))
  );
}
export function restore(): Config {
  try {
    const c = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (c && typeof c === "object" && ["oak", "walnut"].includes(c.front))
      c.front = "chalk";
    return isConfig(c) ? c : defaults;
  } catch {
    return defaults;
  }
}
export const finishName = (id: string) =>
  finishes.find((f) => f.id === id)!.name;
export const dimensions = (c: Config) => ({
  width: c.columns * 40 + 4,
  height: c.rows * 36 + 4 + (c.legs ? FOOT_HEIGHT_CM : 4),
  depth: 38,
});
export const reference = (c: Config) =>
  "FM-" +
  c.columns +
  c.rows +
  "-" +
  c.finish.toUpperCase() +
  "-" +
  c.front.toUpperCase() +
  "-" +
  (c.doors ? "D" : "O") +
  (c.legs ? "P" : "S") +
  (c.decor ? "A" : "N");
