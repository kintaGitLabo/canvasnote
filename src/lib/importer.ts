import DOMPurify from 'dompurify'
import type { EditorElement, EditorPage, PagePreset } from '../types'
import { PAGE_SIZES } from '../types'
import { uid } from './project'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    WHOLE_DOCUMENT: true,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['srcdoc', 'formaction'],
    ALLOW_DATA_ATTR: true,
  })
}

export interface RenderedImport { page: EditorPage; preset: PagePreset; css: string }

function detectPreset(html: string): PagePreset {
  const pageRule = html.match(/@page\s*{[\s\S]*?}/i)?.[0] || ''
  if (/size\s*:\s*(?:91mm\s+55mm|55mm\s+91mm)/i.test(pageRule)) return /size\s*:\s*55mm\s+91mm/i.test(pageRule) ? 'Business card portrait' : 'Business card landscape'
  if (/size\s*:\s*A6\s+landscape/i.test(pageRule)) return 'A6 landscape'
  if (/size\s*:\s*A6/i.test(pageRule)) return 'A6 portrait'
  if (/size\s*:\s*A5\s+landscape/i.test(pageRule)) return 'A5 landscape'
  if (/size\s*:\s*A5/i.test(pageRule)) return 'A5 portrait'
  if (/size\s*:\s*A4\s+landscape/i.test(pageRule) || /size\s*:\s*landscape/i.test(pageRule)) return 'A4 landscape'
  if (/size\s*:\s*A4/i.test(pageRule)) return 'A4 portrait'
  return '16:9'
}

function pageMargins(html: string) {
  const rule = html.match(/@page\s*{[\s\S]*?}/i)?.[0] || ''
  const values = rule.match(/margin\s*:\s*([^;}]+)/i)?.[1]?.trim().split(/\s+/) || []
  const toPx = (value = '0') => { const n = Number.parseFloat(value); return /mm$/i.test(value) ? n * 96 / 25.4 : /pt$/i.test(value) ? n * 96 / 72 : n }
  const [a,b=a,c=a,d=b] = values
  return { top:toPx(a), right:toPx(b), bottom:toPx(c), left:toPx(d) }
}

const rgbToHex = (color: string) => {
  if (isTransparent(color)) return 'transparent'
  const match=color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  return match ? `#${match.slice(1,4).map(v=>Number(v).toString(16).padStart(2,'0')).join('')}` : color
}
const isTransparent = (color: string) => color==='transparent'||/^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/i.test(color.replace(/\s+/g,' '))

/** Render arbitrary HTML in a script-free iframe, then flatten its computed boxes into editable canvas elements. */
export async function importRenderedHtml(html: string): Promise<RenderedImport> {
  const preset=detectPreset(html), size=PAGE_SIZES[preset], margins=pageMargins(html), clean=sanitizeHtml(html)
  const iframe=document.createElement('iframe')
  iframe.setAttribute('sandbox','allow-same-origin')
  Object.assign(iframe.style,{position:'fixed',left:'-100000px',top:'0',width:`${size.width}px`,height:`${size.height}px`,border:'0',visibility:'hidden'})
  document.body.appendChild(iframe)
  try {
    const loaded=new Promise<void>((resolve,reject)=>{iframe.onload=()=>resolve();setTimeout(()=>reject(new Error('HTMLの描画がタイムアウトしました。')),8000)})
    iframe.srcdoc=clean.replace(/<\/head>/i,`<style id="canvasnote-import">html{width:${size.width}px;min-height:${size.height}px;background:#fff}body{width:${size.width}px;min-height:${size.height}px;padding:${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px!important;overflow:hidden}</style></head>`)
    await loaded
    const win=iframe.contentWindow!,doc=iframe.contentDocument!
    await doc.fonts?.ready
    const bodyRect=doc.body.getBoundingClientRect(), elements:EditorElement[]=[]
    let z=1
    const add=(element:EditorElement)=>{if(element.width>0&&element.height>0&&elements.length<500)elements.push(element)}
    for(const node of [...doc.body.querySelectorAll<HTMLElement>('*')]){
      const tag=node.tagName.toLowerCase();if(['script','style','link','meta','br'].includes(tag))continue
      const cs=win.getComputedStyle(node),rect=node.getBoundingClientRect()
      if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0||rect.width<1||rect.height<1)continue
      const x=rect.left-bodyRect.left,y=rect.top-bodyRect.top
      if(tag==='img') add({id:uid(),type:'image',x,y,width:rect.width,height:rect.height,rotation:0,zIndex:z++,src:(node as HTMLImageElement).src,style:{borderRadius:num(cs.borderRadius,0),opacity:num(cs.opacity,1)}})
      if(!isTransparent(cs.backgroundColor)&&tag!=='img') add({id:uid(),type:'shape',x,y,width:rect.width,height:rect.height,rotation:0,zIndex:z++,style:{backgroundColor:rgbToHex(cs.backgroundColor),borderColor:'transparent',borderWidth:0,borderRadius:num(cs.borderRadius,0),opacity:num(cs.opacity,1)}})
      const borders=[
        {width:num(cs.borderTopWidth,0),color:cs.borderTopColor,x,y,widthBox:rect.width,heightBox:num(cs.borderTopWidth,0)},
        {width:num(cs.borderRightWidth,0),color:cs.borderRightColor,x:x+rect.width-num(cs.borderRightWidth,0),y,widthBox:num(cs.borderRightWidth,0),heightBox:rect.height},
        {width:num(cs.borderBottomWidth,0),color:cs.borderBottomColor,x,y:y+rect.height-num(cs.borderBottomWidth,0),widthBox:rect.width,heightBox:num(cs.borderBottomWidth,0)},
        {width:num(cs.borderLeftWidth,0),color:cs.borderLeftColor,x,y,widthBox:num(cs.borderLeftWidth,0),heightBox:rect.height},
      ]
      if(tag!=='img')for(const border of borders)if(border.width>0&&!isTransparent(border.color))add({id:uid(),type:'shape',x:border.x,y:border.y,width:border.widthBox,height:border.heightBox,rotation:0,zIndex:z++,style:{backgroundColor:rgbToHex(border.color),borderColor:'transparent',borderWidth:0,borderRadius:0,opacity:num(cs.opacity,1)}})
      for(const child of [...node.childNodes]){
        if(child.nodeType!==Node.TEXT_NODE||!child.textContent?.trim())continue
        const range=doc.createRange();range.selectNodeContents(child);const r=range.getBoundingClientRect();if(r.width<1||r.height<1)continue
        add({id:uid(),type:'text',x:r.left-bodyRect.left,y:r.top-bodyRect.top,width:Math.min(size.width-(r.left-bodyRect.left),Math.max(r.width+4,16)),height:Math.max(r.height+3,num(cs.lineHeight,num(cs.fontSize,16)*1.4)),rotation:0,zIndex:z++,content:child.textContent.trim(),style:{fontFamily:cs.fontFamily,fontSize:num(cs.fontSize,16),fontWeight:num(cs.fontWeight,400),fontStyle:cs.fontStyle,textDecoration:cs.textDecorationLine,textAlign:(['left','center','right'].includes(cs.textAlign)?cs.textAlign:'left') as 'left'|'center'|'right',color:rgbToHex(cs.color),backgroundColor:'transparent',borderColor:'transparent',borderWidth:0,opacity:num(cs.opacity,1)}})
      }
    }
    return {page:{id:uid(),name:doc.title||'HTMLインポート',background:rgbToHex(win.getComputedStyle(doc.body).backgroundColor)||'#ffffff',elements},preset,css:''}
  } finally { iframe.remove() }
}

function num(value: string | null | undefined, fallback: number) { const parsed = Number.parseFloat(value || ''); return Number.isFinite(parsed) ? parsed : fallback }

export function importHtml(html: string): EditorPage {
  const clean = sanitizeHtml(html)
  const doc = new DOMParser().parseFromString(clean, 'text/html')
  const candidates = [...doc.body.querySelectorAll<HTMLElement>('[data-editor-type]')]
  const source = candidates.length ? candidates : [...doc.body.children] as HTMLElement[]
  const elements: EditorElement[] = source.slice(0, 100).map((node, index) => {
    const style = node.style
    const tag = node.tagName.toLowerCase()
    const requested = node.dataset.editorType
    const type = requested === 'image' || tag === 'img' ? 'image' : requested === 'shape' ? 'shape' : 'text'
    return {
      id: node.dataset.editorId || uid(), type,
      x: num(node.dataset.x || style.left, 70 + index * 12), y: num(node.dataset.y || style.top, 70 + index * 12),
      width: num(node.dataset.width || style.width, type === 'text' ? 520 : 240), height: num(node.dataset.height || style.height, type === 'text' ? 80 : 160),
      rotation: num(node.dataset.rotation, 0), zIndex: num(style.zIndex, index + 1),
      content: type === 'text' ? node.textContent || '' : undefined,
      src: type === 'image' ? (node as HTMLImageElement).src : undefined,
      style: {
        fontFamily: style.fontFamily || 'Noto Sans JP, sans-serif', fontSize: num(style.fontSize, 32), fontWeight: num(style.fontWeight, 400),
        color: style.color || '#182230', backgroundColor: style.backgroundColor || (type === 'shape' ? '#2764e7' : 'transparent'),
        borderColor: style.borderColor || 'transparent', borderWidth: num(style.borderWidth, 0), borderRadius: num(style.borderRadius, 0),
        textAlign: (['left','center','right'].includes(style.textAlign) ? style.textAlign : 'left') as 'left'|'center'|'right', opacity: num(style.opacity, 1),
      },
    }
  })
  return { id: uid(), name: doc.title || 'HTMLインポート', background: doc.body.style.backgroundColor || '#ffffff', elements }
}
