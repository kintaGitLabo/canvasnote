import type { EditorElement } from '../types'

export interface SelectionBox { x:number;y:number;width:number;height:number }

export function elementsInsideBox(elements:EditorElement[],box:SelectionBox){
 return elements.filter(el=>el.x<box.x+box.width&&el.x+el.width>box.x&&el.y<box.y+box.height&&el.y+el.height>box.y).map(el=>el.id)
}

export function offsetSelected(elements:EditorElement[],ids:string[],dx:number,dy:number){
 return elements.map(el=>ids.includes(el.id)?{...el,x:el.x+dx,y:el.y+dy}:el)
}
