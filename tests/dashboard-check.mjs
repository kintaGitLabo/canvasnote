import {chromium} from 'playwright'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true}),page=await context.newPage(),errors=[]
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message))
await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'})
await page.getByRole('heading',{name:'保存した資料'}).waitFor()
await page.getByRole('button',{name:'新しい資料',exact:true}).click()
await page.getByLabel('文書タイトル').fill('保存テスト資料')
await page.waitForTimeout(800)
await page.locator('button[title="保存した資料"]').click()
const card=page.locator('.project-card').filter({hasText:'保存テスト資料'})
if(await card.count()!==1)throw new Error('Saved project was not listed')
await page.screenshot({path:join(tmpdir(),'canvasnote-dashboard.png'),fullPage:true})
await card.getByRole('button',{name:'開く'}).click()
if(await page.getByLabel('文書タイトル').inputValue()!=='保存テスト資料')throw new Error('Saved project did not reopen')
await page.locator('button[title="保存した資料"]').click()
const download=page.waitForEvent('download')
await page.locator('.project-card').filter({hasText:'保存テスト資料'}).getByRole('button',{name:'PNG画像'}).click()
await download
console.log(JSON.stringify({saved:true,reopened:true,png:true,errors,screenshot:join(tmpdir(),'canvasnote-dashboard.png')},null,2))
await browser.close()
