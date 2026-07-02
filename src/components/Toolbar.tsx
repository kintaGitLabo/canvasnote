import { ChevronDown, Code2, FileDown, FolderOpen, ImagePlus, LayoutGrid, Redo2, Shapes, Type, Undo2 } from 'lucide-react'
import type { PagePreset } from '../types'

interface Props { title:string;preset:PagePreset;zoom:number;canUndo:boolean;canRedo:boolean;saving:boolean;onHome:()=>void; onTitle:(v:string)=>void;onPreset:(v:PagePreset)=>void;onZoom:(v:number)=>void;onUndo:()=>void;onRedo:()=>void;onAddText:()=>void;onAddShape:()=>void;onImage:()=>void;onImport:()=>void;onProject:()=>void;onPdf:()=>void }
export function Toolbar(p:Props){return <header className="toolbar">
  <button className="brand brand-button" onClick={p.onHome} title="保存した資料"><span className="brand-mark"><LayoutGrid size={19}/></span><span>CanvasNote</span></button>
  <input className="title-input" value={p.title} onChange={e=>p.onTitle(e.target.value)} aria-label="文書タイトル"/>
  <span className={`save-state ${p.saving?'saving':''}`}>{p.saving?'保存中…':'● 保存済み'}</span>
  <div className="toolbar-center"><button className="icon-button" onClick={p.onUndo} disabled={!p.canUndo} title="元に戻す"><Undo2 size={18}/></button><button className="icon-button" onClick={p.onRedo} disabled={!p.canRedo} title="やり直す"><Redo2 size={18}/></button>
    <button className="tool-button" onClick={p.onAddText}><Type size={17}/>テキスト</button><button className="tool-button" onClick={p.onAddShape}><Shapes size={17}/>図形</button><button className="tool-button" onClick={p.onImage}><ImagePlus size={17}/>画像</button>
    <label className="select-control page-size-select"><select value={p.preset} onChange={e=>p.onPreset(e.target.value as PagePreset)}><option value="16:9">16:9</option><option value="A4 portrait">A4 縦</option><option value="A4 landscape">A4 横</option><option value="A5 portrait">A5 縦</option><option value="A5 landscape">A5 横</option><option value="A6 portrait">A6 縦</option><option value="A6 landscape">A6 横</option><option value="Business card landscape">名刺 横（91×55mm）</option><option value="Business card portrait">名刺 縦（55×91mm）</option></select><ChevronDown size={14}/></label>
    <label className="select-control zoom"><select value={p.zoom} onChange={e=>p.onZoom(Number(e.target.value))}><option value={.5}>50%</option><option value={.75}>75%</option><option value={1}>100%</option><option value={1.25}>125%</option><option value={1.5}>150%</option><option value={2}>200%</option></select><ChevronDown size={14}/></label>
  </div>
  <div className="toolbar-actions"><button className="tool-button" onClick={p.onImport}><Code2 size={17}/>HTML読込</button><button className="tool-button" onClick={p.onProject}><FolderOpen size={17}/>プロジェクト</button><button className="primary-button" onClick={p.onPdf}><FileDown size={17}/>PDF出力</button></div>
  </header>}
