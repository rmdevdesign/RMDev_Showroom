import { describe, it, expect } from "vitest";
import { defaults, isConfig, dimensions, placements } from "./config";
describe("configuration du showroom", () => {
  it("rejette les données hors limites et les mauvais types", () => {
    for (const value of [
      null,
      {},
      { ...defaults, columns: 99 },
      { ...defaults, rows: 0 },
      { ...defaults, finish: "client" },
      { ...defaults, doors: "true" },
    ])
      expect(isConfig(value)).toBe(false);
    expect(isConfig(JSON.parse(JSON.stringify(defaults)))).toBe(true);
  });
  it("calcule les dimensions selon les modules et les pieds", () => {
    expect(dimensions(defaults)).toEqual({ width: 124, height: 84, depth: 38 });
    expect(
      dimensions({ ...defaults, columns: 4, rows: 4, legs: false }),
    ).toEqual({ width: 164, height: 152, depth: 38 });
  });
});
describe("décoration automatique", () => {
  it("occupe uniquement les cases ouvertes et varie avec le format", () => {
    const first = placements(defaults);
    expect(placements({ ...defaults, decor: false })).toEqual({});
    expect(placements({ ...defaults, columns: 4 })).not.toEqual(first);
    expect(placements({ ...defaults, finish: "ink" })).toEqual(first);
    for (const columns of [2, 3, 4])
      for (const rows of [2, 3, 4])
        for (const doors of [false, true]) {
          const layout = placements({ ...defaults, columns, rows, doors });
          for (const key of Object.keys(layout)) {
            const [x, y] = key.split(":").map(Number);
            expect(x).toBeLessThan(columns);
            expect(y).toBeLessThan(rows);
            expect(y).toBeGreaterThanOrEqual(doors ? 1 : 0);
          }
        }
  });
});

describe("répartition visuelle", () => {
  it("utilise tous les niveaux ouverts et espace les plantes sur le grand meuble", () => {
    const layout = placements({ ...defaults, columns: 4, rows: 4 });
    expect(
      new Set(Object.keys(layout).map((key) => key.split(":")[1])).size,
    ).toBe(3);
    const plants = Object.entries(layout)
      .filter(([, prop]) => prop.type === "plant")
      .map(([key]) => key.split(":").map(Number));
    for (let i = 0; i < plants.length; i++)
      for (let j = i + 1; j < plants.length; j++)
        expect(
          Math.abs(plants[i][0] - plants[j][0]) +
            Math.abs(plants[i][1] - plants[j][1]),
        ).toBeGreaterThan(1);
  });
});
