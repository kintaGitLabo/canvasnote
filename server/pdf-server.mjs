import express from 'express'
import { chromium } from 'playwright'

const app = express()
app.use(express.json({ limit: '25mb' }))
app.use((req,res,next)=>{res.setHeader('Access-Control-Allow-Origin','http://localhost:5173');res.setHeader('Access-Control-Allow-Headers','Content-Type');if(req.method==='OPTIONS')return res.sendStatus(204);next()})

app.post('/api/pdf', async (req,res) => {
  const html = typeof req.body?.html === 'string' ? req.body.html : ''
  if (!html || html.length > 25_000_000) return res.status(400).send('HTMLが空か、サイズ上限を超えています。')
  if (/<script\b|<iframe\b|<object\b|<embed\b|on\w+\s*=/i.test(html)) return res.status(400).send('安全でないHTMLを検出しました。')
  let browser
  try {
    try { browser = await chromium.launch({ headless: true }) }
    catch { browser = await chromium.launch({ channel: 'msedge', headless: true }) }
    const page = await browser.newPage()
    await page.route('**/*', route => {
      const url = route.request().url()
      if (url.startsWith('data:') || url.startsWith('about:')) route.continue()
      else route.abort()
    })
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } })
    res.type('application/pdf').send(pdf)
  } catch (error) {
    console.error(error)
    res.status(500).send('PDFを生成できませんでした。Playwright Chromiumをインストールしてください: npx playwright install chromium')
  } finally { await browser?.close() }
})

app.listen(4310, '127.0.0.1', () => console.log('CanvasNote PDF server: http://127.0.0.1:4310'))
