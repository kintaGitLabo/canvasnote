import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1584, height: 992 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'テキスト' }).click()
await page.locator('.canvas-element.selected').waitFor()
if (!await page.getByText('位置とサイズ').isVisible()) throw new Error('Inspector did not open')
await page.getByRole('button', { name: 'ページを追加', exact: true }).click()
if (!await page.getByText('2 / 2').isVisible()) throw new Error('Page was not added')
await page.getByRole('button', { name: 'HTML読込' }).click()
if (!await page.getByRole('heading', { name: 'HTMLを読み込む' }).isVisible()) throw new Error('Import dialog did not open')
await page.getByRole('button', { name: 'キャンセル' }).click()
await mkdir('tmp/qa', { recursive: true })
await page.screenshot({ path: 'tmp/qa/canvasnote-implementation.png', fullPage: true })
console.log(JSON.stringify({ title: await page.title(), pages: await page.locator('.thumbnail-row').count(), errors }, null, 2))
await browser.close()
