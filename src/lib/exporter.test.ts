import { describe, expect, it } from 'vitest'
import { createProject } from './project'
import { projectToHtml } from './exporter'

describe('project HTML export',()=>{it('includes page sizing and editable attributes',()=>{const html=projectToHtml(createProject());expect(html).toContain('@page');expect(html).toContain('data-editor-id');expect(html).toContain('data-editor-type="text"');expect(html).not.toContain('<script')})})
