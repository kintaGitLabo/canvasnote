export type PagePreset = '16:9' | 'A4 portrait' | 'A4 landscape' | 'A5 portrait' | 'A5 landscape' | 'A6 portrait' | 'A6 landscape' | 'Business card landscape' | 'Business card portrait'
export type ElementType = 'text' | 'shape' | 'image' | 'group'
export interface PdfSourceInfo { pageNumber:number; kind:'text'|'image'|'vector'|'ocr'; sourceName:string }

export interface EditorElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  content?: string
  src?: string
  groupId?: string
  locked?: boolean
  pdfSource?: PdfSourceInfo
  ocrConfidence?: number
  style: {
    fontFamily?: string
    fontSize?: number
    fontWeight?: number
    fontStyle?: string
    textDecoration?: string
    textAlign?: 'left' | 'center' | 'right'
    color?: string
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    clipPath?: string
    opacity?: number
  }
}

export interface EditorPage {
  id: string
  name: string
  background: string
  elements: EditorElement[]
}

export interface CanvasProject {
  version: 1
  id: string
  title: string
  preset: PagePreset
  pages: EditorPage[]
  css: string
  assets: Record<string, string>
  meta: { createdAt: string; updatedAt: string }
}

export interface PdfImportWarning { pageNumber?:number; code:'OCR_USED'|'OCR_FAILED'|'COMPLEX_GRAPHICS'|'FONT_FALLBACK'|'LARGE_FILE'; message:string }
export interface PdfImportResult { pages:EditorPage[]; preset:PagePreset; warnings:PdfImportWarning[]; sourceName:string }
export type ImportProgress = { phase:'loading'|'rendering'|'extracting'|'ocr'|'complete';page:number;total:number;ratio:number;message:string }

export const PAGE_SIZES: Record<PagePreset, { width: number; height: number; pdf: [number, number] }> = {
  '16:9': { width: 1280, height: 720, pdf: [338.67, 190.5] },
  'A4 portrait': { width: 794, height: 1123, pdf: [210, 297] },
  'A4 landscape': { width: 1123, height: 794, pdf: [297, 210] },
  'A5 portrait': { width: 559, height: 794, pdf: [148, 210] },
  'A5 landscape': { width: 794, height: 559, pdf: [210, 148] },
  'A6 portrait': { width: 397, height: 559, pdf: [105, 148] },
  'A6 landscape': { width: 559, height: 397, pdf: [148, 105] },
  'Business card landscape': { width: 344, height: 208, pdf: [91, 55] },
  'Business card portrait': { width: 208, height: 344, pdf: [55, 91] },
}
