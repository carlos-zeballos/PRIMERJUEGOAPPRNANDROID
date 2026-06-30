const { chromium } = require('@playwright/test');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exportDir = path.join(root, '.expo-export-visual-qa');
const outDir = path.join(root, 'visual-qa-output');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const fs = require('fs');
  fs.mkdirSync(outDir, { recursive: true });

  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const requested = path.normalize(path.join(exportDir, urlPath));
    const safeRequested = requested.startsWith(exportDir) ? requested : path.join(exportDir, 'index.html');
    const filePath = fs.existsSync(safeRequested) && fs.statSync(safeRequested).isFile()
      ? safeRequested
      : path.join(exportDir, 'index.html');
    const ext = path.extname(filePath).toLowerCase();
    const type = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.ico': 'image/x-icon',
      '.json': 'application/json',
      '.ttf': 'font/ttf',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));
  await sleep(400);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
  });

  const pages = [
    { name: 'setup-mobile', path: '/(game)/setup', viewport: { width: 390, height: 844 } },
    { name: 'setup-small', path: '/(game)/setup', viewport: { width: 360, height: 740 } },
    { name: 'board-mobile', path: '/visual-qa-board', viewport: { width: 390, height: 844 } },
    { name: 'board-small', path: '/visual-qa-board', viewport: { width: 360, height: 740 } },
  ];

  const report = [];

  for (const item of pages) {
    const page = await browser.newPage({ viewport: item.viewport, deviceScaleFactor: 1 });
    const consoleMessages = [];
    page.on('console', (msg) => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
    page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`));
    const url = `http://127.0.0.1:4173${item.path}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(outDir, `${item.name}.png`), fullPage: true });
    const metrics = await page.evaluate(() => ({
      url: location.href,
      body: {
        width: document.body.scrollWidth,
        height: document.body.scrollHeight,
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight,
      },
      overflowX: document.body.scrollWidth > document.documentElement.clientWidth + 2,
      texts: [...document.querySelectorAll('span, div')].slice(0, 120).map((node) => {
        const rect = node.getBoundingClientRect();
        const text = (node.textContent || '').trim();
        return text && rect.width && rect.height
          ? { text: text.slice(0, 40), x: rect.x, y: rect.y, w: rect.width, h: rect.height }
          : null;
      }).filter(Boolean),
    }));
    report.push({ name: item.name, consoleMessages, ...metrics });
    await page.close();
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Visual QA written to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
