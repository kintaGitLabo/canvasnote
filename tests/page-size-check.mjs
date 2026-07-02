import {chromium} from 'playwright'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[]
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message))
await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'})
await page.getByRole('button',{name:'新しい資料',exact:true}).click()
const select=page.locator('.page-size-select select'),canvas=page.locator('.document-canvas')
const checks=[]
for(const [preset,width,height] of [['A5 portrait',559,794],['A6 landscape',559,397],['Business card landscape',344,208]]){await select.selectOption(preset);await page.waitForTimeout(100);const size=await canvas.evaluate(node=>({width:node.clientWidth,height:node.clientHeight}));checks.push({preset,...size});if(size.width!==width||size.height!==height)throw new Error(`${preset} rendered ${size.width}x${size.height}`)}
const screenshot=join(tmpdir(),'canvasnote-business-card.png');await page.screenshot({path:screenshot,fullPage:true})
const canvasBox=await canvas.boundingBox(),workspaceBox=await page.locator('.workspace').boundingBox();if(!canvasBox||!workspaceBox)throw new Error('Layout boxes missing');const centerDifference=Math.round((canvasBox.x+canvasBox.width/2)-(workspaceBox.x+workspaceBox.width/2));if(Math.abs(centerDifference)>2)throw new Error(`Canvas center is offset by ${centerDifference}px`)
console.log(JSON.stringify({checks,centerDifference,errors,screenshot},null,2));await browser.close()
