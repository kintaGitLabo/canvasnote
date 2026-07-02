import type { CanvasProject, EditorElement, EditorPage, PagePreset } from '../types'
import { PAGE_SIZES } from '../types'

export const uid = () => crypto.randomUUID()

const element = (partial: Partial<EditorElement> & Pick<EditorElement, 'type'>): EditorElement => ({
  id: uid(), x: 80, y: 80, width: 360, height: 100, rotation: 0, zIndex: 1,
  style: {}, ...partial,
})

export function createStarterPage(index = 0): EditorPage {
  if (index > 0) return { id: uid(), name: `ページ ${index + 1}`, background: '#ffffff', elements: [] }
  return {
    id: uid(), name: 'タイトル', background: '#ffffff',
    elements: [
      element({ type: 'shape', x: 0, y: 520, width: 520, height: 200, zIndex: 1, style: { backgroundColor: '#2764e7', borderRadius: 70, borderWidth: 0, borderColor: 'transparent' } }),
      element({ type: 'shape', x: 1100, y: -140, width: 280, height: 280, zIndex: 1, style: { backgroundColor: '#ff6b57', borderRadius: 999, borderWidth: 0, borderColor: 'transparent' } }),
      element({ type: 'text', x: 110, y: 170, width: 760, height: 160, zIndex: 2, content: 'アイデアを、\n伝わる資料へ。', style: { fontFamily: 'Noto Sans JP, sans-serif', fontSize: 64, fontWeight: 800, color: '#182230', textAlign: 'left', borderWidth: 0, borderColor: 'transparent' } }),
      element({ type: 'text', x: 115, y: 370, width: 760, height: 60, zIndex: 2, content: 'HTMLから始める、自由なドキュメント制作', style: { fontFamily: 'Noto Sans JP, sans-serif', fontSize: 26, fontWeight: 400, color: '#3f4855', textAlign: 'left', borderWidth: 0, borderColor: 'transparent' } }),
    ],
  }
}

export function createProject(preset: PagePreset = '16:9'): CanvasProject {
  const now = new Date().toISOString()
  return { version: 1, id: uid(), title: '新しいプレゼンテーション', preset, pages: [createStarterPage()], css: '', assets: {}, meta: { createdAt: now, updatedAt: now } }
}

export const cloneElement = (el: EditorElement): EditorElement => ({ ...structuredClone(el), id: uid(), x: el.x + 16, y: el.y + 16 })
export const clonePage = (page: EditorPage): EditorPage => ({ ...structuredClone(page), id: uid(), name: `${page.name} のコピー`, elements: page.elements.map(e => ({ ...e, id: uid() })) })

export function resizeProject(project:CanvasProject,preset:PagePreset){
 const from=PAGE_SIZES[project.preset],to=PAGE_SIZES[preset],scale=Math.min(to.width/from.width,to.height/from.height),offsetX=(to.width-from.width*scale)/2,offsetY=(to.height-from.height*scale)/2
 for(const page of project.pages)for(const el of page.elements){el.x=Math.round(el.x*scale+offsetX);el.y=Math.round(el.y*scale+offsetY);el.width=Math.max(1,Math.round(el.width*scale));el.height=Math.max(1,Math.round(el.height*scale));if(el.style.fontSize)el.style.fontSize=Math.max(1,el.style.fontSize*scale);if(el.style.borderWidth)el.style.borderWidth*=scale;if(el.style.borderRadius)el.style.borderRadius*=scale}
 project.preset=preset
}
