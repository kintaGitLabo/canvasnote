import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { EditorElement, EditorPage } from '../types'
import { elementsInsideBox } from '../lib/selection'

interface Props {
  page: EditorPage; zoom: number; selectedIds: string[]; editingId: string | null
  onSelect: (id: string | null, additive?: boolean) => void; onSelectMany: (ids: string[]) => void; onEditing: (id: string | null) => void
  onChange: (id: string, patch: Partial<EditorElement>, commit?: boolean) => void
  onMoveMany: (ids: string[], positions: Record<string,{x:number;y:number}>, commit?: boolean) => void
  canvasRef?: (node: HTMLDivElement | null) => void
}
type Marquee={startX:number;startY:number;x:number;y:number;width:number;height:number}

export function MultiSelectCanvas({page,zoom,selectedIds,editingId,onSelect,onSelectMany,onEditing,onChange,onMoveMany,canvasRef}:Props){
 const drag=useRef<{id:string;ids:string[];startX:number;startY:number;positions:Record<string,{x:number;y:number}>;mode:'move'|'resize';width:number;height:number}|null>(null),canvasNode=useRef<HTMLDivElement|null>(null)
 const marqueeRef=useRef<Marquee|null>(null),[marquee,setMarquee]=useState<Marquee|null>(null)
 const startElement=(e:ReactPointerEvent,el:EditorElement,mode:'move'|'resize')=>{if(editingId===el.id)return;e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);const adding=e.shiftKey&&!selectedIds.includes(el.id),ids=selectedIds.includes(el.id)?selectedIds:adding?[...selectedIds,el.id]:[el.id];if(mode==='move')onSelect(el.id,e.shiftKey);drag.current={id:el.id,ids,startX:e.clientX,startY:e.clientY,positions:Object.fromEntries(page.elements.filter(item=>ids.includes(item.id)).map(item=>[item.id,{x:item.x,y:item.y}])),mode,width:el.width,height:el.height}}
 const moveElement=(e:ReactPointerEvent)=>{const d=drag.current;if(!d)return;const dx=(e.clientX-d.startX)/zoom,dy=(e.clientY-d.startY)/zoom;if(d.mode==='resize'){onChange(d.id,{width:Math.max(24,Math.round(d.width+dx)),height:Math.max(24,Math.round(d.height+dy))});return}onMoveMany(d.ids,Object.fromEntries(d.ids.map(id=>[id,{x:Math.round(d.positions[id].x+dx),y:Math.round(d.positions[id].y+dy)}])))}
 const endElement=()=>{const d=drag.current;if(!d)return;d.mode==='resize'?onChange(d.id,{},true):onMoveMany(d.ids,{},true);drag.current=null}
 const pointOnCanvas=(e:ReactPointerEvent)=>{const rect=canvasNode.current?.getBoundingClientRect();return rect?{x:(e.clientX-rect.left)/zoom,y:(e.clientY-rect.top)/zoom}:{x:0,y:0}}
 const startMarquee=(e:ReactPointerEvent<HTMLDivElement>)=>{if((e.target as HTMLElement).closest('.canvas-element'))return;e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);onEditing(null);const point=pointOnCanvas(e),next={startX:point.x,startY:point.y,x:point.x,y:point.y,width:0,height:0};marqueeRef.current=next;setMarquee(next)}
 const moveMarquee=(e:ReactPointerEvent<HTMLDivElement>)=>{const start=marqueeRef.current;if(!start)return;const point=pointOnCanvas(e),next={...start,x:Math.min(start.startX,point.x),y:Math.min(start.startY,point.y),width:Math.abs(point.x-start.startX),height:Math.abs(point.y-start.startY)};marqueeRef.current=next;setMarquee(next)}
 const endMarquee=()=>{const box=marqueeRef.current;if(!box)return;if(box.width<3&&box.height<3)onSelectMany([]);else onSelectMany(elementsInsideBox(page.elements,box));marqueeRef.current=null;setMarquee(null)}
 return <div className="canvas-stage" onPointerDown={startMarquee} onPointerMove={moveMarquee} onPointerUp={endMarquee}><div className="canvas-scale"><div className="canvas-transform" style={{transform:`scale(${zoom})`}}><div className="document-canvas" ref={node=>{canvasNode.current=node;canvasRef?.(node)}} data-canvas-page={page.id} style={{background:page.background}} onPointerDown={startMarquee} onPointerMove={moveMarquee} onPointerUp={endMarquee}>
  {[...page.elements].sort((a,b)=>a.zIndex-b.zIndex).map(el=>{const selected=selectedIds.includes(el.id),editing=el.id===editingId,common:React.CSSProperties={left:el.x,top:el.y,width:el.width,height:el.height,transform:`rotate(${el.rotation}deg)`,zIndex:el.zIndex,backgroundColor:el.style.backgroundColor,borderColor:el.style.borderColor||'transparent',borderWidth:el.style.borderWidth??0,borderStyle:'solid',borderRadius:el.style.borderRadius,opacity:el.style.opacity};return <div key={el.id} className={`canvas-element ${selected?'selected':''} ${editing?'editing':''}`} style={common} onPointerDown={e=>startElement(e,el,'move')} onPointerMove={moveElement} onPointerUp={endElement} onDoubleClick={e=>{e.stopPropagation();if(el.type==='text'&&selectedIds.length===1)onEditing(el.id)}}>
   {el.type==='image'?<img src={el.src} alt="" draggable={false}/>:el.type==='text'?<div className="text-content" contentEditable={editing} suppressContentEditableWarning style={{fontFamily:el.style.fontFamily,fontSize:el.style.fontSize,fontWeight:el.style.fontWeight,fontStyle:el.style.fontStyle,textDecoration:el.style.textDecoration,textAlign:el.style.textAlign,color:el.style.color}} onBlur={e=>{onChange(el.id,{content:e.currentTarget.innerText},true);onEditing(null)}}>{el.content}</div>:null}
   {selected&&!editing&&<><span className="selection-outline"/>{selectedIds.length===1&&<><button aria-label="サイズ変更" className="resize-handle se" onPointerDown={e=>startElement(e,el,'resize')} onPointerMove={moveElement} onPointerUp={endElement}/><span className="resize-handle nw"/><span className="resize-handle ne"/><span className="resize-handle sw"/></>}</>}
  </div>})}
  {marquee&&<div className="selection-marquee" style={{left:marquee.x,top:marquee.y,width:marquee.width,height:marquee.height}}/>}
 </div></div></div></div>
}
