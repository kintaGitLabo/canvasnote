import { describe, expect, it } from "vitest";
import { contrastTextColorForRgb } from "./pdfTextContrast";

describe("PDF extracted text contrast", () => {
  it("uses dark text on a light background", () => {
    expect(contrastTextColorForRgb(255, 255, 255)).toBe("#111827");
    expect(contrastTextColorForRgb(245, 180, 80)).toBe("#111827");
  });

  it("uses white text on a dark background", () => {
    expect(contrastTextColorForRgb(5, 20, 45)).toBe("#ffffff");
    expect(contrastTextColorForRgb(30, 80, 140)).toBe("#ffffff");
  });
});
