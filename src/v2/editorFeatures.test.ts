import { describe, expect, it } from "vitest";
import type { EditorElement } from "../types";
import { isBackgroundColorMatch } from "../lib/imageBackgroundRemover";
import { groupElements, selectionForElement } from "./operations";

const element=(id:string):EditorElement=>({id,type:'shape',x:0,y:0,width:10,height:10,rotation:0,zIndex:1,style:{}})

describe('editor feature fixes',()=>{
 it('assigns one shared group id and selects the whole group',()=>{
  const grouped=groupElements([element('a'),element('b'),element('c')],['a','b'],'group-1')
  expect(grouped.map(e=>e.groupId)).toEqual(['group-1','group-1',undefined])
  expect(selectionForElement(grouped,grouped[0],[],false)).toEqual(['a','b'])
 })
 it('recognizes similar white backgrounds but keeps distinct foreground colors',()=>{
  expect(isBackgroundColorMatch([250,250,250],[255,255,255],20)).toBe(true)
  expect(isBackgroundColorMatch([30,80,180],[255,255,255],46)).toBe(false)
 })
})
