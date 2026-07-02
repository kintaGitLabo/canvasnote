import type { CSSProperties } from 'react'
import type { CanvasProject, EditorElement } from '../types'
import { PAGE_SIZES } from '../types'

const styleFor=(el:EditorElement):CSSProperties=>({position:'absolute',left:el.x,top:el.y,width:el.width,height:el.height,transform:`rotate(${el.rotation}deg)`,zIndex:el.zIndex,boxSizing:'border-box',backgroundColor:el.style.backgroundColor,border:`${el.style.borderWidth||0}px solid ${el.style.borderColor||'transparent'}`,borderRadius:el.style.borderRadius,opacity:el.style.opacity,overflow:'hidden'})

export function ExportPages({project,onNode}:{project:CanvasProject;onNode:(id:string,node:HTMLDivElement|null)=>void}){
 const size=PAGE_SIZES[project.preset]
 return <div className="export-render" aria-hidden>{project.pages.map(page=><div key={page.id} ref={node=>onNode(page.id,node)} style={{position:'relative',width:size.width,height:size.height,overflow:'hidden',background:page.background}}>{[...page.elements].sort((a,b)=>a.zIndex-b.zIndex).map(el=><div key={el.id} style={styleFor(el)}>{el.type==='image'?<img src={el.src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:el.type==='text'?<div style={{width:'100%',height:'100%',whiteSpace:'pre-wrap',lineHeight:1.25,fontFamily:el.style.fontFamily,fontSize:el.style.fontSize,fontWeight:el.style.fontWeight,fontStyle:el.style.fontStyle,textDecoration:el.style.textDecoration,textAlign:el.style.textAlign,color:el.style.color}}>{el.content}</div>:null}</div>)}</div>)}</div>
}
