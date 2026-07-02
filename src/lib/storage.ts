import { openDB } from 'idb'
import type { CanvasProject } from '../types'

const db = openDB('canvasnote', 1, { upgrade(database) { database.createObjectStore('projects') } })
export async function saveProject(project: CanvasProject) { const database=await db;await database.put('projects',project,project.id);await database.put('projects',project,'current');localStorage.setItem('canvasnote-current-id',project.id) }
export async function loadProject(): Promise<CanvasProject | undefined> { const database=await db,id=localStorage.getItem('canvasnote-current-id');return id?await database.get('projects',id):await database.get('projects','current') }
export async function listProjects():Promise<CanvasProject[]>{const database=await db,keys=await database.getAllKeys('projects'),items=await database.getAll('projects');const unique=new Map<string,CanvasProject>();items.forEach((item,index)=>{if(keys[index]!=='current'&&item?.id)unique.set(item.id,item)});const legacy=await database.get('projects','current');if(legacy?.id&&!unique.has(legacy.id))unique.set(legacy.id,legacy);return [...unique.values()].sort((a,b)=>b.meta.updatedAt.localeCompare(a.meta.updatedAt))}
export async function deleteStoredProject(id:string){const database=await db,current=await database.get('projects','current');await database.delete('projects',id);if(current?.id===id)await database.delete('projects','current');if(localStorage.getItem('canvasnote-current-id')===id)localStorage.removeItem('canvasnote-current-id')}
