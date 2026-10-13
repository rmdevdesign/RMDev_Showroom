import { jsPDF } from "jspdf";
import {
  dimensions,
  reference,
  finishes,
  frontFinishes,
  feetFinishes,
  FOOT_HEIGHT_CM,
  type Config,
} from "./config";
import { cabinetPanels } from "./cabinetGeometry";
import { woodAppearance, woodColorUrl } from "./woodAppearance";
import regularUrl from "./assets/fonts/InstrumentSans-Regular.ttf?url";
import semiboldUrl from "./assets/fonts/InstrumentSans-Semibold.ttf?url";
import serifUrl from "./assets/fonts/InstrumentSerif.ttf?url";

const INK = "#292723",
  MUTED = "#76716a",
  ACCENT = "#703f35",
  PAPER = "#f8f6f2",
  LINE = "#ded9d0";
const LEFT = 16,
  RIGHT = 194,
  WIDTH = 178;
let resources: Promise<{ fonts: string[]; wood: HTMLImageElement }> | undefined;
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image PDF indisponible"));
    image.src = url;
  });
}
async function fontData(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Police PDF indisponible");
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768)
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(binary);
}
function loadResources() {
  if (!resources)
    resources = Promise.all([
      Promise.all([regularUrl, semiboldUrl, serifUrl].map(fontData)),
      loadImage(woodColorUrl),
    ])
      .then(([fonts, wood]) => ({ fonts, wood }))
      .catch((error) => {
        resources = undefined;
        throw error;
      });
  return resources;
}

function type(
  doc: jsPDF,
  size: number,
  color = INK,
  face: "sans" | "serif" | "bold" = "sans",
) {
  doc.setFont(
    face === "serif" ? "InstrumentSerif" : "InstrumentSans",
    face === "bold" ? "bold" : "normal",
  );
  doc.setFontSize(size);
  doc.setTextColor(color);
}
function rule(doc: jsPDF, y: number) {
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.25);
  doc.line(LEFT, y, RIGHT, y);
}
function header(doc: jsPDF, page: number) {
  doc.setFillColor(PAPER);
  doc.rect(0, 0, 210, 297, "F");
  type(doc, 26, INK, "bold");
  doc.text("FORME", LEFT, 24);
  type(doc, 26, ACCENT, "bold");
  doc.text(".", LEFT + doc.getTextWidth("FORME"), 24);
  type(doc, 9, MUTED);
  doc.text("RM Dev Design / Showroom", RIGHT, 23, { align: "right" });
  rule(doc, 32);
  rule(doc, 276);
  type(doc, 7.5, MUTED);
  doc.text("Concept de mobilier fictif · Fiche de démonstration", LEFT, 283);
  doc.text(String(page).padStart(2, "0") + " / 02", RIGHT, 283, {
    align: "right",
  });
  type(doc, 7.5, MUTED);
  doc.text("Design & développement / rmdev.design", LEFT, 289);
}

async function cropSnapshot(url: string) {
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.fillStyle = "#e9e6e1";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const background = [pixels[0], pixels[1], pixels[2]];
  let minX = canvas.width,
    minY = canvas.height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < canvas.height; y += 2)
    for (let x = 0; x < canvas.width; x += 2) {
      const i = (y * canvas.width + x) * 4;
      if (
        pixels[i + 3] > 20 &&
        Math.max(
          ...background.map((value, c) => Math.abs(pixels[i + c] - value)),
        ) > 18
      ) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  if (maxX <= minX || maxY <= minY)
    throw new Error("La scène 3D n’est pas encore prête.");
  const padding = Math.round(Math.max(maxX - minX, maxY - minY) * 0.07);
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(canvas.width, maxX + padding);
  maxY = Math.min(canvas.height, maxY + padding);
  const crop = document.createElement("canvas");
  crop.width = maxX - minX;
  crop.height = maxY - minY;
  const cropContext = crop.getContext("2d", { alpha: false })!;
  cropContext.fillStyle = "#e9e6e1";
  cropContext.fillRect(0, 0, crop.width, crop.height);
  cropContext.drawImage(
    canvas,
    minX,
    minY,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );
  return crop.toDataURL("image/jpeg", 0.96);
}

function materialSwatch(
  doc: jsPDF,
  image: HTMLImageElement,
  id: string,
  color: string,
  x: number,
  y: number,
  isWood: boolean,
) {
  if (isWood) {
    const source = woodAppearance(image, id);
    const crop = document.createElement("canvas");
    crop.width = 256;
    crop.height = 256;
    crop
      .getContext("2d")!
      .drawImage(source, 256, 256, 512, 512, 0, 0, 256, 256);
    doc.addImage(crop.toDataURL("image/jpeg", 0.92), "JPEG", x, y, 19, 19);
  } else {
    doc.setFillColor(color);
    doc.rect(x, y, 19, 19, "F");
  }
  doc.setDrawColor("#cfc6b9");
  doc.setLineWidth(0.15);
  doc.rect(x, y, 19, 19);
}

function dimensionLine(
  doc: jsPDF,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  vertical = false,
) {
  doc.setDrawColor("#a49b8e");
  doc.setLineWidth(0.2);
  doc.line(x1, y1, x2, y2);
  if (vertical) {
    doc.line(x1 - 1.4, y1, x1 + 1.4, y1);
    doc.line(x2 - 1.4, y2, x2 + 1.4, y2);
    type(doc, 9, MUTED);
    doc.text(label, x1 - 3, (y1 + y2) / 2, { angle: 90, align: "center" });
  } else {
    doc.line(x1, y1 - 1.4, x1, y1 + 1.4);
    doc.line(x2, y2 - 1.4, x2, y2 + 1.4);
    type(doc, 9, MUTED);
    doc.text(label, (x1 + x2) / 2, y1 + 5, { align: "center" });
  }
}

function elevation(doc: jsPDF, c: Config) {
  const d = dimensions(c),
    scale = Math.min(132 / d.width, 98 / d.height),
    w = d.width * scale,
    h = d.height * scale;
  const x = LEFT + (WIDTH - w) / 2,
    y = 73 + (98 - h) / 2,
    base = c.legs ? FOOT_HEIGHT_CM : 4;
  const projectY = (worldY: number) => y + h - (worldY * 100 + base) * scale;
  const frontColor = frontFinishes.find((f) => f.id === c.front)!.color;
  // True panel rectangles match the configurator's assembled geometry.
  doc.setFillColor("#ebe5d9");
  doc.setDrawColor("#9e9483");
  doc.setLineWidth(0.18);
  for (const panel of cabinetPanels(c)) {
    if (panel.id === "back") continue;
    const px =
      x + (panel.position[0] * 100 + d.width / 2 - panel.size[0] * 50) * scale;
    const py = projectY(panel.position[1] + panel.size[1] / 2);
    doc.rect(
      px,
      py,
      panel.size[0] * 100 * scale,
      panel.size[1] * 100 * scale,
      "FD",
    );
  }
  if (c.doors)
    for (let col = 0; col < c.columns; col++) {
      const px = x + (col * 40 + 3.75) * scale,
        py = projectY(0.361);
      doc.setFillColor(frontColor);
      doc.rect(px, py, 36.5 * scale, 32.2 * scale, "FD");
      doc.setFillColor("#c2b49b");
      doc.circle(px + 32.3 * scale, py + 14.1 * scale, 0.35 * scale, "F");
    }
  if (c.legs) {
    const foot = feetFinishes.find((f) => f.id === (c.feet ?? "graphite"))!;
    doc.setFillColor(foot.color);
    doc.setDrawColor(foot.color);
    for (const xx of [7.5, d.width - 7.5])
      doc.rect(
        x + (xx - 0.9) * scale,
        y + h - base * scale,
        1.8 * scale,
        base * scale,
        "F",
      );
  } else {
    doc.setFillColor("#b4aa98");
    doc.rect(
      x + 5 * scale,
      y + h - base * scale,
      (d.width - 10) * scale,
      base * scale,
      "F",
    );
  }
  dimensionLine(doc, x, y + h + 9, x + w, y + h + 9, d.width + " cm");
  dimensionLine(doc, x - 10, y, x - 10, y + h, d.height + " cm", true);
  type(doc, 8, MUTED);
  doc.text("Vue de face · profondeur " + d.depth + " cm", 105, 191, {
    align: "center",
  });
}

export async function createConfigurationPdf(
  config: Config,
  snapshot?: string,
): Promise<jsPDF> {
  const { fonts, wood } = await loadResources();
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  });
  [
    ["InstrumentSans-Regular.ttf", "InstrumentSans", "normal"],
    ["InstrumentSans-Semibold.ttf", "InstrumentSans", "bold"],
    ["InstrumentSerif.ttf", "InstrumentSerif", "normal"],
  ].forEach(([file, family, style], i) => {
    doc.addFileToVFS(file, fonts[i]);
    doc.addFont(file, family, style);
  });
  doc.setProperties({
    title: "FORME — Module 01",
    subject: "Fiche de configuration",
    author: "RM Dev Design",
    creator: "FORME / RM Dev Design",
  });
  const d = dimensions(config),
    structure = finishes.find((f) => f.id === config.finish)!,
    front = frontFinishes.find((f) => f.id === config.front)!,
    feet = feetFinishes.find((f) => f.id === (config.feet ?? "graphite"))!;
  header(doc, 1);
  type(doc, 9, ACCENT);
  doc.text("BIBLIOTHÈQUE MODULAIRE", LEFT, 43);
  type(doc, 40, INK, "serif");
  doc.text("Module 01.", LEFT, 60);
  type(doc, 10, MUTED);
  doc.text(
    config.columns + " colonnes · " + config.rows + " niveaux",
    RIGHT,
    58,
    { align: "right" },
  );
  doc.setFillColor("#e9e6e1");
  doc.rect(LEFT, 69, WIDTH, 117, "F");
  if (snapshot) {
    const image = await cropSnapshot(snapshot);
    const props = doc.getImageProperties(image);
    const scale = Math.min((WIDTH - 12) / props.width, 107 / props.height);
    doc.addImage(
      image,
      "JPEG",
      LEFT + (WIDTH - props.width * scale) / 2,
      74 + (107 - props.height * scale) / 2,
      props.width * scale,
      props.height * scale,
    );
  } else {
    type(doc, 10, MUTED);
    doc.text("Aperçu indisponible sur cet appareil.", 105, 129, {
      align: "center",
    });
  }
  const blocks = [
    ["LARGEUR", d.width],
    ["HAUTEUR", d.height],
    ["PROFONDEUR", d.depth],
  ] as const;
  blocks.forEach(([label, value], i) => {
    const x = LEFT + (i * WIDTH) / 3;
    type(doc, 8, MUTED);
    doc.text(label, x, 198);
    type(doc, 29, INK, "serif");
    doc.text(String(value), x, 212);
    const valueWidth = doc.getTextWidth(String(value));
    type(doc, 10, MUTED);
    doc.text("cm", x + valueWidth + 3, 212);
    if (i < 2) {
      doc.setDrawColor(LINE);
      doc.line(x + WIDTH / 3 - 8, 195, x + WIDTH / 3 - 8, 215);
    }
  });
  rule(doc, 222);
  const materials = [
    {
      label: "Structure",
      value: structure.name,
      id: structure.id,
      color: structure.color,
      wood: ["oak", "walnut", "chalk"].includes(structure.id),
    },
    {
      label: "Façades",
      value: config.doors ? front.name : "Sans portes",
      id: front.id,
      color: front.color,
      wood: false,
    },
    {
      label: "Piètement",
      value: config.legs ? feet.name : "Socle",
      id: config.legs ? feet.id : structure.id,
      color: config.legs ? feet.color : structure.color,
      wood: !config.legs && ["oak", "walnut", "chalk"].includes(structure.id),
    },
  ];
  materials.forEach((material, i) => {
    const x = LEFT + (i * WIDTH) / 3;
    if (i === 1 && !config.doors) {
      doc.setDrawColor(LINE);
      doc.setLineWidth(0.2);
      doc.setLineDashPattern([1, 1], 0);
      doc.rect(x, 233, 19, 19);
      doc.setLineDashPattern([], 0);
    } else
      materialSwatch(
        doc,
        wood,
        material.id,
        material.color,
        x,
        233,
        material.wood,
      );
    type(doc, 8, MUTED);
    doc.text(material.label, x + 23, 238);
    type(doc, 10, INK, "bold");
    doc.text(doc.splitTextToSize(material.value, 31), x + 23, 245);
  });
  type(doc, 7.5, MUTED);
  doc.text(reference(config), LEFT, 266);
  doc.addPage();
  header(doc, 2);
  type(doc, 9, ACCENT);
  doc.text("MODULE 01 / FICHE TECHNIQUE", LEFT, 43);
  type(doc, 30, INK, "serif");
  doc.text("Dimensions & détails", LEFT, 58);
  elevation(doc, config);
  rule(doc, 201);
  const details = [
    ["Composition", config.columns + " colonnes / " + config.rows + " niveaux"],
    ["Structure", structure.name + " · panneaux de 35 mm"],
    [
      "Façades",
      config.doors
        ? front.name + " · portes affleurantes de 12 mm"
        : "Cases ouvertes, sans portes",
    ],
    [
      "Piètement",
      config.legs
        ? feet.name + " · pieds métal de " + FOOT_HEIGHT_CM + " cm"
        : "Socle bas de 4 cm",
    ],
  ];
  details.forEach(([label, value], i) => {
    const y = 211 + i * 10;
    type(doc, 9, MUTED);
    doc.text(label, LEFT, y);
    type(doc, 10);
    doc.text(value, 66, y);
    if (i < details.length - 1) {
      doc.setDrawColor(LINE);
      doc.setLineWidth(0.15);
      doc.line(LEFT, y + 3.5, RIGHT, y + 3.5);
    }
  });
  type(doc, 7.5, MUTED);
  doc.text(
    "Dimensions indicatives. Les teintes affichées dépendent de votre écran.",
    LEFT,
    264,
  );
  doc.text(
    "Ce document présente un concept : il ne constitue ni un devis ni un plan de fabrication.",
    LEFT,
    269,
  );
  return doc;
}

export async function exportPdf(config: Config, snapshot?: string) {
  const doc = await createConfigurationPdf(config, snapshot);
  doc.save("FORME-" + reference(config) + ".pdf");
}
