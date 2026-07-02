import {describe,expect,it} from 'vitest'
import {PAGE_SIZES} from '../types'
import {createProject,resizeProject} from './project'

describe('page presets',()=>{
 it('uses ISO A5 and A6 dimensions',()=>{expect(PAGE_SIZES['A5 portrait'].pdf).toEqual([148,210]);expect(PAGE_SIZES['A6 landscape'].pdf).toEqual([148,105])})
 it('uses Japanese business card dimensions',()=>{expect(PAGE_SIZES['Business card landscape'].pdf).toEqual([91,55]);expect(PAGE_SIZES['Business card portrait'].pdf).toEqual([55,91])})
 it('fits existing content into a smaller preset',()=>{const project=createProject(),originalWidth=project.pages[0].elements[2].width;resizeProject(project,'Business card landscape');const resized=project.pages[0].elements[2];expect(project.preset).toBe('Business card landscape');expect(resized.width).toBeLessThan(originalWidth);expect(resized.x+resized.width).toBeLessThanOrEqual(344)})
})
