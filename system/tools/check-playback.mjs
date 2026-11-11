// Exercise the actual encoded MP4 in Chromium at normal speed, over HTTP with byte ranges.
// Usage: LIB=/path/to/lemo-opuscar node system/tools/check-playback.mjs film.mp4 report.json
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
const [filename, report] = process.argv.slice(2);
if (!filename || !report) throw new Error('usage: check-playback.mjs film.mp4 report.json');
const file = path.resolve(filename), size = fs.statSync(file).size;
const require = createRequire(path.join(process.env.LIB || process.env.LEMO_OPUSCAR_HOME || path.join(process.env.HOME,'lemo-opuscar'), 'package.json'));
const { chromium } = require('playwright-core');
const server = http.createServer((req,res) => {
  if (req.url !== '/video.mp4') return res.writeHead(200, {'content-type':'text/html'}).end('<!doctype html><meta name="viewport" content="width=device-width"><body style="margin:0;background:#090f1b"><video id="v" muted playsinline controls style="width:360px;height:640px;object-fit:contain" src="/video.mp4"></video>');
  const m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  const start = m ? +m[1] : 0, end = m && m[2] ? Math.min(+m[2], size-1) : size-1;
  if (start >= size || start > end) return res.writeHead(416, {'content-range':`bytes */${size}`}).end();
  res.writeHead(m ? 206 : 200, {'content-type':'video/mp4','accept-ranges':'bytes','content-length':end-start+1,...(m?{'content-range':`bytes ${start}-${end}/${size}`}:{})});
  fs.createReadStream(file,{start,end}).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME || undefined});
  const page=await browser.newPage({viewport:{width:360,height:640}});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>v.readyState>=2 || v.error,{timeout:20000});
  const before=await page.evaluate(()=>({error:v.error?.message || null,width:v.videoWidth,height:v.videoHeight,duration:v.duration,canPlay:v.canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.2"')}));
  if (before.error || !before.width || !before.height) throw new Error(JSON.stringify(before));
  await page.evaluate(()=>v.play());
  await page.waitForFunction(()=>v.currentTime>=Math.min(2,v.duration/2) || v.error,{timeout:20000});
  fs.mkdirSync(path.dirname(path.resolve(report)),{recursive:true});
  await page.screenshot({path:report.replace(/\.json$/,'.jpg'),type:'jpeg',quality:90});
  await page.waitForFunction(()=>v.ended || v.error,{timeout:Math.ceil((before.duration+20)*1000)});
  const after=await page.evaluate(()=>({ended:v.ended,currentTime:v.currentTime,error:v.error?.message||null,quality:v.getVideoPlaybackQuality().toJSON?.() || {totalVideoFrames:v.getVideoPlaybackQuality().totalVideoFrames,droppedVideoFrames:v.getVideoPlaybackQuality().droppedVideoFrames}}));
  const result={file:path.basename(file),browser:'Chromium',...before,...after,status:after.ended&&!after.error?'PLAYBACK_COMPLETED':'FAILED',scope:'Current cloud browser playback; does not prove that a chat download link or the user device works, or that artistic quality is accepted.'};
  fs.writeFileSync(report,JSON.stringify(result,null,2)+'\n');
  if(result.status==='FAILED') throw new Error(JSON.stringify(result));
  console.log(JSON.stringify(result));
} finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
