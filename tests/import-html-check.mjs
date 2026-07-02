import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const source = process.argv[2]
if (!source) throw new Error('HTML file path is required')
const html = await readFile(source, 'utf8')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1584, height: 992 } })
const page = await context.newPage()
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'HTML読込' }).click()
await page.getByPlaceholder('HTMLをここに貼り付け…').fill(html)
await page.getByRole('button', { name: '読み込む' }).click()
await page.getByRole('heading', { name: 'HTMLを読み込む' }).waitFor({ state: 'hidden', timeout: 15000 })
const importedTitle = page.locator('.canvas-element').filter({ hasText: '救急箱の中身と、ご提供価格' })
if (await importedTitle.count() !== 1) throw new Error('Imported title was not uniquely editable')
await importedTitle.click()
if (!await page.getByText('位置とサイズ').isVisible()) throw new Error('Imported element could not be selected')
await importedTitle.dblclick()
const editableTitle = page.locator('.canvas-element.editing .text-content')
await editableTitle.fill('編集できる救急箱提案書')
await editableTitle.press('Tab')
const result = await page.evaluate(() => ({
  preset: document.querySelector('.select-control select')?.value,
  elements: document.querySelectorAll('.document-canvas .canvas-element').length,
  title: document.querySelector('.title-input')?.value,
  canvas: { width: document.querySelector('.document-canvas')?.clientWidth, height: document.querySelector('.document-canvas')?.clientHeight },
  editedText: [...document.querySelectorAll('.text-content')].some(node => node.textContent === '編集できる救急箱提案書'),
  inspectorVisible: !!document.querySelector('.inspector-section .field-grid'),
}))
const screenshot = join(tmpdir(), 'canvasnote-imported-html.png')
await page.screenshot({ path: screenshot, fullPage: true })
console.log(JSON.stringify({ ...result, errors, screenshot }, null, 2))
await browser.close()
