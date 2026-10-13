export const woodColorUrl = new URL(
  "./assets/wood/Wood049_1K-JPG_Color.jpg",
  import.meta.url,
).href;
const cache = new Map<string, HTMLCanvasElement>();
// One colour transformation shared by the material and the selector preview.
export function woodAppearance(
  image: CanvasImageSource,
  finish: string,
): HTMLCanvasElement {
  const existing = cache.get(finish);
  if (existing) return existing;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, 1024, 1024);
  const pixels = ctx.getImageData(0, 0, 1024, 1024);
  const tone =
    finish === "chalk"
      ? [238, 235, 223]
      : finish === "walnut"
        ? [178, 145, 110]
        : [218, 192, 151];
  for (let i = 0; i < pixels.data.length; i += 4) {
    const lum =
      (pixels.data[i] * 0.2126 +
        pixels.data[i + 1] * 0.7152 +
        pixels.data[i + 2] * 0.0722) /
      255;
    const grain = finish === "chalk" ? 0.88 + lum * 0.25 : 0.72 + lum * 0.65;
    for (let channel = 0; channel < 3; channel++)
      pixels.data[i + channel] = Math.min(255, tone[channel] * grain);
  }
  ctx.putImageData(pixels, 0, 0);
  cache.set(finish, canvas);
  return canvas;
}
