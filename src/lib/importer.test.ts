import { describe, expect, it } from 'vitest'
import { importHtml, sanitizeHtml } from './importer'

describe('HTML importer',()=>{
 it('removes executable content',()=>{const clean=sanitizeHtml('<div onclick="alert(1)">safe</div><script>alert(1)</script><iframe src="x"></iframe>');expect(clean).not.toMatch(/script|onclick|iframe/i);expect(clean).toContain('safe')})
 it('imports the dedicated editor format',()=>{const page=importHtml('<div data-editor-id="a" data-editor-type="text" data-x="12" data-y="20" data-width="300" style="font-size:42px">こんにちは</div>');expect(page.elements).toHaveLength(1);expect(page.elements[0]).toMatchObject({id:'a',type:'text',x:12,y:20,width:300,content:'こんにちは'});expect(page.elements[0].style.fontSize).toBe(42)})
})
