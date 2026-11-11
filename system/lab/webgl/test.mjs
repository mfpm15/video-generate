// node system/lab/webgl/test.mjs -> WebGL2 availability, GPU string, and render speed at 1920x1080 (scene of 60 lit meshes)
import path from 'path'; import { pathToFileURL, fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)); const LIB = process.env.LIB || path.join(process.env.HOME || process.env.USERPROFILE, 'lemo-opuscar');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const { browser, page } = await openDemo(HERE, { w: 1920, h: 1080, q: '', warnings: true, gl: true });
console.log('INFO', JSON.stringify(await page.evaluate(() => window.INFO)));
const t0 = Date.now(); for (let i = 0; i < 60; i++) { await page.evaluate(t => window.render(t), i / 30); await page.screenshot({ type: 'jpeg', quality: 80 }); }
const dt = (Date.now() - t0) / 1000; console.log(`60 frames render+screenshot in ${dt.toFixed(1)} s = ${(60 / dt).toFixed(1)} fps (one worker)`);
await page.evaluate(() => window.render(1)); await page.screenshot({ path: path.join(HERE, 'webgl-test.jpg'), type: 'jpeg', quality: 80 });
await browser.close(); closeServer();
