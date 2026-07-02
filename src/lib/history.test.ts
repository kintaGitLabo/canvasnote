import { describe, expect, it } from 'vitest'
import { History } from './history'

describe('History',()=>{it('supports undo and redo',()=>{const h=new History(1);h.push(2);h.push(3);expect(h.undo()).toBe(2);expect(h.undo()).toBe(1);expect(h.redo()).toBe(2);expect(h.canRedo).toBe(true)})})
