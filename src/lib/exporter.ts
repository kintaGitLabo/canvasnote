import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import type { CanvasProject } from '../types'
import { PAGE_SIZES } from '../types'

const esc = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!))

export function projectToHtml(project: CanvasProject): string {
  const size = PAGE_SIZES[project.preset]
  const pages = project.pages.map(page => `<section class="canvasnote-page" style="position:relative;width:${size.width}px;height:${size.height}px;overflow:hidden;background:${page.background}">${page.elements.sort((a,b)=>a.zIndex-b.zIndex).map(el => {
    const s = el.style; const base = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;transform:rotate(${el.rotation}deg);z-index:${el.zIndex};box-sizing:border-box;background:${s.backgroundColor||'transparent'};border:${s.borderWidth||0}px solid ${s.borderColor||'transparent'};border-radius:${s.borderRadius||0}px;clip-path:${s.clipPath||'none'};opacity:${s.opacity??1}`
    if (el.type === 'image') return `<img data-editor-id="${el.id}" data-editor-type="image" data-x="${el.x}" data-y="${el.y}" data-width="${el.width}" data-height="${el.height}" src="${esc(el.src||'')}" style="${base};object-fit:cover" />`
    if (el.type === 'shape') return `<div data-editor-id="${el.id}" data-editor-type="shape" data-x="${el.x}" data-y="${el.y}" data-width="${el.width}" data-height="${el.height}" style="${base}"></div>`
    return `<div data-editor-id="${el.id}" data-editor-type="text" data-x="${el.x}" data-y="${el.y}" data-width="${el.width}" data-height="${el.height}" style="${base};white-space:pre-wrap;font-family:${s.fontFamily};font-size:${s.fontSize}px;font-weight:${s.fontWeight};font-style:${s.fontStyle||'normal'};text-decoration:${s.textDecoration||'none'};text-align:${s.textAlign||'left'};color:${s.color||'#182230'}">${esc(el.content||'')}</div>`
  }).join('')}</section>`).join('')
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>${esc(project.title)}</title><style>@page{margin:0;size:${size.pdf[0]}mm ${size.pdf[1]}mm}*{box-sizing:border-box}html,body{margin:0;padding:0}.canvasnote-page{page-break-after:always}${project.css}</style></head><body>${pages}</body></html>`
}

export async function exportBrowserPdf(nodes: HTMLElement[], project: CanvasProject, onProgress?: (value:number)=>void) {
  const [w,h] = PAGE_SIZES[project.preset].pdf
  const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'mm', format: [w,h], compress: true })
  for (let i=0;i<nodes.length;i++) { if (i) pdf.addPage([w,h], w > h ? 'landscape' : 'portrait'); const data = await toPng(nodes[i], { pixelRatio: 1.5, cacheBust: true }); pdf.addImage(data, 'PNG', 0, 0, w, h, undefined, 'FAST'); onProgress?.((i+1)/nodes.length) }
  pdf.save(`${project.title}.pdf`)
}

export async function exportPagePng(node:HTMLElement,title:string){const data=await toPng(node,{pixelRatio:2,cacheBust:true});const a=document.createElement('a');a.href=data;a.download=`${title}.png`;a.click()}

export function download(name: string, content: string, type: string) { const url = URL.createObjectURL(new Blob([content], {type})); const a=document.createElement('a'); a.href=url;a.download=name;a.click();URL.revokeObjectURL(url) }
