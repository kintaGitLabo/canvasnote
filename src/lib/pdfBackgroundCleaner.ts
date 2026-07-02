import type { EditorElement } from "../types";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("PDF背景画像を処理できませんでした"));
    image.src = src;
  });
}

function dominantBorderColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const left = Math.max(0, Math.floor(x - 5));
  const top = Math.max(0, Math.floor(y - 5));
  const right = Math.min(ctx.canvas.width, Math.ceil(x + width + 5));
  const bottom = Math.min(ctx.canvas.height, Math.ceil(y + height + 5));
  const image = ctx.getImageData(left, top, Math.max(1, right - left), Math.max(1, bottom - top));
  const counts = new Map<string, { count: number; r: number; g: number; b: number }>();
  const w = image.width;
  for (let py = 0; py < image.height; py++) {
    for (let px = 0; px < w; px++) {
      const onBorder = py < 4 || py >= image.height - 4 || px < 4 || px >= w - 4;
      if (!onBorder) continue;
      const i = (py * w + px) * 4;
      if (image.data[i + 3] < 200) continue;
      const r = image.data[i], g = image.data[i + 1], b = image.data[i + 2];
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const value = counts.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      value.count++;
      value.r += r;
      value.g += g;
      value.b += b;
      counts.set(key, value);
    }
  }
  const best = [...counts.values()].sort((a, b) => b.count - a.count)[0];
  if (!best) return "rgb(255 255 255)";
  return `rgb(${Math.round(best.r / best.count)} ${Math.round(best.g / best.count)} ${Math.round(best.b / best.count)})`;
}

export async function removeExtractedTextFromBackground(
  source: string,
  pageWidth: number,
  pageHeight: number,
  textElements: EditorElement[],
) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("PDF背景画像を処理できませんでした");
  ctx.drawImage(image, 0, 0);
  const scaleX = canvas.width / pageWidth;
  const scaleY = canvas.height / pageHeight;
  for (const element of textElements) {
    const x = element.x * scaleX;
    const y = element.y * scaleY;
    const width = element.width * scaleX;
    const height = element.height * scaleY;
    ctx.fillStyle = dominantBorderColor(ctx, x, y, width, height);
    const padding = Math.max(2, Math.round(Math.min(scaleX, scaleY) * 2));
    ctx.fillRect(x - padding, y - padding, width + padding * 2, height + padding * 2);
  }
  return canvas.toDataURL("image/png");
}
