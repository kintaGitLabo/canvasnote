import {describe,expect,it} from 'vitest'
import type {EditorElement} from '../types'
import {elementsInsideBox,offsetSelected} from './selection'

const element=(id:string,x:number,y:number):EditorElement=>({id,type:'shape',x,y,width:100,height:50,rotation:0,zIndex:1,style:{}})
describe('multiple selection',()=>{
 it('selects every element touched by a marquee',()=>{const items=[element('a',10,10),element('b',150,150),element('c',400,400)];expect(elementsInsideBox(items,{x:0,y:0,width:300,height:300})).toEqual(['a','b'])})
 it('supports a marquee that starts outside the page',()=>{const items=[element('a',10,10),element('b',300,300)];expect(elementsInsideBox(items,{x:-120,y:-80,width:260,height:200})).toEqual(['a'])})
 it('moves selected elements by the same offset',()=>{const moved=offsetSelected([element('a',10,10),element('b',50,70),element('c',400,400)],['a','b'],0,24);expect(moved.map(item=>item.y)).toEqual([34,94,400])})
})
