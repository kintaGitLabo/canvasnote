import { describe, expect, it } from "vitest";
import type { EditorElement } from "../types";
import {
  isPdfBackground,
  removePdfBackground,
  setPdfBackgroundVisible,
} from "./operations";

const background: EditorElement = {
  id: "pdf-bg",
  type: "image",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  zIndex: 0,
  locked: true,
  pdfSource: { pageNumber: 1, kind: "image", sourceName: "sample.pdf" },
  style: { opacity: 1 },
};

const text: EditorElement = {
  id: "text",
  type: "text",
  x: 10,
  y: 10,
  width: 50,
  height: 20,
  rotation: 0,
  zIndex: 2,
  content: "編集できる文字",
  pdfSource: { pageNumber: 1, kind: "text", sourceName: "sample.pdf" },
  style: { opacity: 1 },
};

describe("PDF background controls", () => {
  it("hides and restores only the fixed PDF background", () => {
    const hidden = setPdfBackgroundVisible([background, text], false);
    expect(hidden[0].style.opacity).toBe(0);
    expect(hidden[1]).toEqual(text);
    expect(setPdfBackgroundVisible(hidden, true)[0].style.opacity).toBe(1);
  });

  it("removes the PDF background without deleting extracted text", () => {
    expect(isPdfBackground(background)).toBe(true);
    expect(removePdfBackground([background, text])).toEqual([text]);
  });
});
