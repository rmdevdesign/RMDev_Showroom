import type { Config } from "./config";
export type Panel = {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
};
export function cabinetPanels(config: Config): Panel[] {
  const width = config.columns * 0.4 + 0.04,
    height = config.rows * 0.36 + 0.04;
  const thickness = 0.035,
    joint = 0.0002,
    depth = 0.355,
    z = 0.0125;
  const panels: Panel[] = [
    {
      id: "back",
      position: [0, height / 2, -0.1775],
      size: [width, height, 0.025],
    },
  ];
  // Shelves run between the side panels; the top and bottom cap the assembly.
  for (let row = 0; row <= config.rows; row++)
    panels.push({
      id: "shelf-" + row,
      position: [0, 0.02 + row * 0.36, z],
      size: [
        row === 0 || row === config.rows
          ? width
          : width - 2 * thickness - joint,
        thickness,
        depth,
      ],
    });
  for (const side of [-1, 1])
    panels.push({
      id: "side-" + side,
      position: [side * (width / 2 - thickness / 2), height / 2, z],
      size: [thickness, height - 0.075 - joint, depth],
    });
  // Each divider occupies one opening. No front faces overlap at shelf crossings.
  for (let col = 1; col < config.columns; col++)
    for (let row = 0; row < config.rows; row++)
      panels.push({
        id: "divider-" + col + "-" + row,
        position: [-width / 2 + 0.02 + col * 0.4, 0.2 + row * 0.36, z],
        size: [thickness, 0.36 - thickness - joint, depth],
      });
  return panels;
}
