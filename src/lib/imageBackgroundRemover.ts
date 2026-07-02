function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('画像を処理できませんでした'));image.src=src})}
export const isBackgroundColorMatch=(rgb:[number,number,number],target:[number,number,number],tolerance:number)=>{const dr=rgb[0]-target[0],dg=rgb[1]-target[1],db=rgb[2]-target[2];return Math.sqrt(dr*dr+dg*dg+db*db)<=tolerance}

export async function removeSolidImageBackground(src:string,tolerance=46){
 const image=await loadImage(src),canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('画像を処理できませんでした');ctx.drawImage(image,0,0)
 const data=ctx.getImageData(0,0,canvas.width,canvas.height),{width,height}=canvas,corners=[[0,0],[width-1,0],[0,height-1],[width-1,height-1]],target=corners.reduce((a,[x,y])=>{const i=(y*width+x)*4;return[a[0]+data.data[i],a[1]+data.data[i+1],a[2]+data.data[i+2]]},[0,0,0]).map(v=>v/4)
 const matches=(i:number)=>isBackgroundColorMatch([data.data[i],data.data[i+1],data.data[i+2]],target as [number,number,number],tolerance)
 const visited=new Uint8Array(width*height),stack:number[]=[];for(let x=0;x<width;x++){stack.push(x,(height-1)*width+x)}for(let y=1;y<height-1;y++){stack.push(y*width,y*width+width-1)}
 while(stack.length){const p=stack.pop()!;if(visited[p])continue;visited[p]=1;const i=p*4;if(!matches(i))continue;data.data[i+3]=0;const x=p%width,y=Math.floor(p/width);if(x>0)stack.push(p-1);if(x<width-1)stack.push(p+1);if(y>0)stack.push(p-width);if(y<height-1)stack.push(p+width)}
 ctx.putImageData(data,0,0);return canvas.toDataURL('image/png')
}
