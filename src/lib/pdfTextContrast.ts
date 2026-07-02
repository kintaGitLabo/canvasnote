export const contrastTextColorForRgb=(r:number,g:number,b:number)=>{
 const channel=(v:number)=>{const c=v/255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4},l=.2126*channel(r)+.7152*channel(g)+.0722*channel(b)
 const whiteContrast=1.05/(l+.05),darkL=.2126*channel(17)+.7152*channel(24)+.0722*channel(39),darkContrast=(Math.max(l,darkL)+.05)/(Math.min(l,darkL)+.05)
 return whiteContrast>darkContrast?'#ffffff':'#111827'
}
