import {GlobalWorkerOptions,getDocument,Util} from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type {EditorElement,EditorPage,ImportProgress,PagePreset,PdfImportResult,PdfImportWarning} from '../types'
import {uid} from './project'
import {contrastTextColorForRgb} from './pdfTextContrast'
GlobalWorkerOptions.workerSrc=workerSrc

const presetFor=(w:number,h:number):PagePreset=>w>=h?'A4 landscape':'A4 portrait'
const contrastTextColor=(canvas:HTMLCanvasElement,x:number,y:number,width:number,height:number)=>{
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return'#111827'
 const left=Math.max(0,Math.floor(x-4)),top=Math.max(0,Math.floor(y-4)),right=Math.min(canvas.width,Math.ceil(x+width+4)),bottom=Math.min(canvas.height,Math.ceil(y+height+4)),pixels=ctx.getImageData(left,top,Math.max(1,right-left),Math.max(1,bottom-top)),colors=new Map<string,{n:number;r:number;g:number;b:number}>()
 for(let py=0;py<pixels.height;py++)for(let px=0;px<pixels.width;px++){if(!(py<3||py>=pixels.height-3||px<3||px>=pixels.width-3))continue;const i=(py*pixels.width+px)*4;if(pixels.data[i+3]<200)continue;const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],key=`${r>>4},${g>>4},${b>>4}`,v=colors.get(key)||{n:0,r:0,g:0,b:0};v.n++;v.r+=r;v.g+=g;v.b+=b;colors.set(key,v)}
 const bg=[...colors.values()].sort((a,b)=>b.n-a.n)[0];return bg?contrastTextColorForRgb(bg.r/bg.n,bg.g/bg.n,bg.b/bg.n):'#111827'
}
export async function importPdf(file:File,onProgress?:(p:ImportProgress)=>void):Promise<PdfImportResult>{
 if(file.size>80*1024*1024)throw new Error('PDFが80MBを超えています。分割して読み込んでください。')
 const warnings:PdfImportWarning[]=[];if(file.size>20*1024*1024)warnings.push({code:'LARGE_FILE',message:'大きなPDFのため読み込みに時間がかかる場合があります。'})
 onProgress?.({phase:'loading',page:0,total:0,ratio:.02,message:'PDFを確認しています…'})
 let pdf;try{pdf=await getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true}).promise}catch{throw new Error('PDFを開けませんでした。破損またはパスワード保護の可能性があります。')}
 const pages:EditorPage[]=[];let preset:PagePreset='A4 portrait'
 for(let n=1;n<=pdf.numPages;n++){
  const page=await pdf.getPage(n),base=page.getViewport({scale:1}),target=presetFor(base.width,base.height),size=target==='A4 portrait'?{width:794,height:1123}:{width:1123,height:794},scale=size.width/base.width,viewport=page.getViewport({scale})
  if(n===1)preset=target;onProgress?.({phase:'rendering',page:n,total:pdf.numPages,ratio:(n-1)/pdf.numPages,message:`${n}/${pdf.numPages}ページを描画中…`})
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise
  const data=canvas.toDataURL('image/png',.92),bg:EditorElement={id:uid(),type:'image',x:0,y:0,width:size.width,height:size.height,rotation:0,zIndex:0,src:data,locked:true,pdfSource:{pageNumber:n,kind:'image',sourceName:file.name},style:{opacity:1}}
  const content=await page.getTextContent(),texts:EditorElement[]=[]
  for(const item of content.items){if(!('str'in item)||!item.str.trim())continue;const tx=Util.transform(viewport.transform,item.transform),fontSize=Math.max(8,Math.hypot(tx[2],tx[3])),width=Math.max(8,item.width*scale),x=tx[4],y=tx[5]-fontSize;texts.push({id:uid(),type:'text',x,y,width,height:fontSize*1.3,rotation:Math.atan2(tx[1],tx[0])*180/Math.PI,zIndex:texts.length+2,content:item.str,pdfSource:{pageNumber:n,kind:'text',sourceName:file.name},style:{fontFamily:'Noto Sans JP, sans-serif',fontSize,fontWeight:400,color:contrastTextColor(canvas,x,y,width,fontSize*1.3),backgroundColor:'transparent',opacity:1}})}
  if(texts.length<2){onProgress?.({phase:'ocr',page:n,total:pdf.numPages,ratio:(n-.5)/pdf.numPages,message:`${n}ページを日本語OCR中…`});try{const{recognize}=await import('tesseract.js');const result=await recognize(data,'jpn+eng',{logger:m=>{if(m.status==='recognizing text')onProgress?.({phase:'ocr',page:n,total:pdf.numPages,ratio:(n-1+Number(m.progress))/pdf.numPages,message:`${n}ページをOCR中 ${Math.round(Number(m.progress)*100)}%`})}});for(const block of result.data.blocks||[])for(const para of block.paragraphs)for(const line of para.lines){const text=line.text.trim(),b=line.bbox;if(text)texts.push({id:uid(),type:'text',x:b.x0,y:b.y0,width:b.x1-b.x0,height:b.y1-b.y0,rotation:0,zIndex:texts.length+2,content:text,ocrConfidence:line.confidence,pdfSource:{pageNumber:n,kind:'ocr',sourceName:file.name},style:{fontFamily:'Noto Sans JP, sans-serif',fontSize:Math.max(10,(b.y1-b.y0)*.8),fontWeight:400,color:contrastTextColor(canvas,b.x0,b.y0,b.x1-b.x0,b.y1-b.y0),backgroundColor:'transparent',opacity:1}})}warnings.push({pageNumber:n,code:'OCR_USED',message:`${n}ページは画像PDFのためOCRを使用しました。文字を確認してください。`})}catch{warnings.push({pageNumber:n,code:'OCR_FAILED',message:`${n}ページのOCRに失敗しました。背景画像の上に文字を追加できます。`})}}
  warnings.push({pageNumber:n,code:'COMPLEX_GRAPHICS',message:`${n}ページの複雑な図表は固定画像レイヤーとして保持しました。`});pages.push({id:uid(),name:`${file.name} - ${n}`,background:'#fff',elements:[bg,...texts]})
 }
 onProgress?.({phase:'complete',page:pdf.numPages,total:pdf.numPages,ratio:1,message:'読み込みが完了しました'});return{pages,preset,warnings,sourceName:file.name}
}
