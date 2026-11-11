import path from 'path'; import { pathToFileURL, fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const LIB = path.join(process.env.USERPROFILE, 'lemo-opuscar');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
for (const q of ['post=0', 'post=1&ss=1', 'post=1&ss=2', 'post=1&ss=1&dof=1', 'post=1&ss=1&ao=1&dof=1']) {
  const { browser, page } = await openDemo(HERE, { w: 1080, h: 1920, q, warnings: false, gl: true });
  const t0 = Date.now(); const N = 24; for (let i = 0; i < N; i++) { await page.evaluate(t => window.render(t), i / 30); await page.screenshot({ type: 'jpeg', quality: 85 }); }
  console.log(q.padEnd(28), ((Date.now() - t0) / N).toFixed(0), 'ms/frame ->', (N / ((Date.now() - t0) / 1000)).toFixed(1), 'fps (1 worker)');
  if (q === 'post=1&ss=1') await page.screenshot({ path: path.join(HERE, 'bench.jpg'), type: 'jpeg', quality: 85 });
  await browser.close();
}
closeServer();
