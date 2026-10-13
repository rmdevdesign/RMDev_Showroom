import { describe, it, expect } from "vitest";
import { cabinetPanels } from "./cabinetGeometry";
import { defaults } from "./config";
describe("panel joinery", () => {
  it("has no intersecting solid panels in any format", () => {
    for (const columns of [2, 3, 4])
      for (const rows of [2, 3, 4]) {
        const panels = cabinetPanels({ ...defaults, columns, rows });
        for (let i = 0; i < panels.length; i++)
          for (let j = i + 1; j < panels.length; j++) {
            const a = panels[i],
              b = panels[j];
            const overlap = [0, 1, 2].every(
              (axis) =>
                Math.min(
                  a.position[axis] + a.size[axis] / 2,
                  b.position[axis] + b.size[axis] / 2,
                ) -
                  Math.max(
                    a.position[axis] - a.size[axis] / 2,
                    b.position[axis] - b.size[axis] / 2,
                  ) >
                1e-8,
            );
            expect(overlap, a.id + " intersects " + b.id).toBe(false);
          }
      }
  });
});
