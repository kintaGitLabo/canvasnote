import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { EditorElement, EditorPage } from '../types'

interface Props {
  page: EditorPage; zoom: number; selectedId: string | null; editingId: string | null
  onSelect: (id: string | null) => void; onEditing: (id: string | null) => void
  onChange: (id: string, patch: Partial<EditorElement>, commit?: boolean) => void
  canvasRef?: (node: HTMLDivElement | null) => void
}

export function EditorCanvas({ page, zoom, selectedId, editingId, onSelect, onEditing, onChange, canvasRef }: Props) {
  const drag = useRef<{id:string; startX:number; startY:number; x:number; y:number; mode:'move'|'resize'; width:number;height:number} | null>(null)
  const start = (e: ReactPointerEvent, el: EditorElement, mode: 'move'|'resize') => {
    if (editingId === el.id) return
    e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); onSelect(el.id)
    drag.current = { id:el.id, startX:e.clientX, startY:e.clientY, x:el.x, y:el.y, mode, width:el.width, height:el.height }
  }
  const move = (e: ReactPointerEvent) => {
    const d=drag.current; if(!d) return
    const dx=(e.clientX-d.startX)/zoom, dy=(e.clientY-d.startY)/zoom
    onChange(d.id, d.mode==='move' ? {x:Math.round(d.x+dx), y:Math.round(d.y+dy)} : {width:Math.max(24,Math.round(d.width+dx)),height:Math.max(24,Math.round(d.height+dy))})
  }
  const end = () => { if (drag.current) onChange(drag.current.id, {}, true); drag.current=null }
  return <div className="canvas-stage" onPointerDown={() => { onSelect(null); onEditing(null) }}>
    <div className="canvas-scale" style={{ transform:`scale(${zoom})` }}>
      <div className="document-canvas" ref={canvasRef} data-canvas-page={page.id} style={{ background:page.background }}>
        {[...page.elements].sort((a,b)=>a.zIndex-b.zIndex).map(el => {
          const selected=el.id===selectedId, editing=el.id===editingId
          const common: React.CSSProperties = { left:el.x,top:el.y,width:el.width,height:el.height,transform:`rotate(${el.rotation}deg)`,zIndex:el.zIndex,
            backgroundColor:el.style.backgroundColor,borderColor:el.style.borderColor||'transparent',borderWidth:el.style.borderWidth??0,borderStyle:'solid',borderRadius:el.style.borderRadius,opacity:el.style.opacity }
          return <div key={el.id} className={`canvas-element ${selected?'selected':''} ${editing?'editing':''}`} style={common}
            onPointerDown={e=>start(e,el,'move')} onPointerMove={move} onPointerUp={end} onDoubleClick={e=>{e.stopPropagation();if(el.type==='text')onEditing(el.id)}}>
            {el.type==='image' ? <img src={el.src} alt="" draggable={false}/> : el.type==='text' ? <div className="text-content" contentEditable={editing} suppressContentEditableWarning
              style={{fontFamily:el.style.fontFamily,fontSize:el.style.fontSize,fontWeight:el.style.fontWeight,fontStyle:el.style.fontStyle,textDecoration:el.style.textDecoration,textAlign:el.style.textAlign,color:el.style.color}}
              onBlur={e=>{onChange(el.id,{content:e.currentTarget.innerText},true);onEditing(null)}}>{el.content}</div> : null}
            {selected && !editing && <><span className="selection-outline"/><button aria-label="サイズ変更" className="resize-handle se" onPointerDown={e=>start(e,el,'resize')} onPointerMove={move} onPointerUp={end}/><span className="resize-handle nw"/><span className="resize-handle ne"/><span className="resize-handle sw"/></>}
          </div>
        })}
      </div>
    </div>
  </div>
}
