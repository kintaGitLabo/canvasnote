import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { CanvasProject, EditorElement, EditorPage } from '../types'
import { PAGE_SIZES } from '../types'

function previewStyle(el:EditorElement):CSSProperties{return{position:'absolute',left:el.x,top:el.y,width:el.width,height:el.height,transform:`rotate(${el.rotation}deg)`,zIndex:el.zIndex,boxSizing:'border-box',overflow:'hidden',backgroundColor:el.style.backgroundColor,border:`${el.style.borderWidth||0}px solid ${el.style.borderColor||'transparent'}`,borderRadius:el.style.borderRadius,clipPath:el.style.clipPath,opacity:el.style.opacity}}

export function PageThumbnail({page,project,large=false,maxWidth,maxHeight}: {page:EditorPage;project:CanvasProject;large?:boolean;maxWidth?:number;maxHeight?:number}){
 const size=PAGE_SIZES[project.preset],scale=Math.min((maxWidth??(large?168:156))/size.width,(maxHeight??(large?240:138))/size.height)
 return <div className="thumb-viewport" style={{width:size.width*scale,height:size.height*scale}}><div className="thumb-page" style={{width:size.width,height:size.height,background:page.background,transform:`scale(${scale})`}}>{[...page.elements].sort((a,b)=>a.zIndex-b.zIndex).map(el=><div key={el.id} style={previewStyle(el)}>{el.type==='image'?<img src={el.src} alt=""/>:el.type==='text'?<div style={{width:'100%',height:'100%',whiteSpace:'pre-wrap',lineHeight:1.25,fontFamily:el.style.fontFamily,fontSize:el.style.fontSize,fontWeight:el.style.fontWeight,fontStyle:el.style.fontStyle,textDecoration:el.style.textDecoration,textAlign:el.style.textAlign,color:el.style.color}}>{el.content}</div>:null}</div>)}</div></div>
}

interface Props { project: CanvasProject; active: number; onSelect:(i:number)=>void; onAdd:()=>void; onDuplicate:(i:number)=>void; onDelete:(i:number)=>void; onMove:(from:number,to:number)=>void }
export function PageRail({project,active,onSelect,onAdd,onDuplicate,onDelete,onMove}:Props) {
  return <aside className="page-rail">
    <div className="panel-heading"><strong>ページ</strong><button className="icon-button" onClick={onAdd} title="ページを追加"><Plus size={18}/></button></div>
    <div className="thumbnail-list">{project.pages.map((page,index)=><div key={page.id} className={`thumbnail-row ${active===index?'active':''}`} draggable onDragStart={e=>e.dataTransfer.setData('text/page-index',String(index))} onDragOver={e=>e.preventDefault()} onDrop={e=>onMove(Number(e.dataTransfer.getData('text/page-index')),index)}>
      <span className="page-number">{index+1}</span><button className="thumbnail" onClick={()=>onSelect(index)} aria-label={`${index+1}ページを開く`}><PageThumbnail page={page} project={project}/></button>
      <div className="thumb-actions"><GripVertical size={14}/><button onClick={()=>onDuplicate(index)} title="複製"><Copy size={13}/></button><button onClick={()=>onDelete(index)} title="削除"><Trash2 size={13}/></button></div>
    </div>)}</div>
    <button className="add-page" onClick={onAdd}><Plus size={17}/>ページを追加</button>
  </aside>
}
