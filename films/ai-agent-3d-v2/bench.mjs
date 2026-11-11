import fs from 'node:fs';import path from 'node:path';import {pathToFileURL,fileURLToPath} from 'node:url';
const lib=process.env.LIB||'/workspace/.tools/lemo-opuscar';const {openDemo,closeServer}=await import(pathToFileURL(path.join(lib,'core/render/page.mjs')));const dir=path.dirname(fileURLToPath(import.meta.url));
const {browser,page}=await openDemo(dir,{w:1080,h:1920});page.setDefaultTimeout(180000);
try{for(const t of [1.5,1.6,4.5,7.5,10.5]){const a=Date.now();await page.evaluate(t=>window.render(t),t);await page.screenshot({path:path.join(dir,`out/preview/t_${t}.jpg`),type:'jpeg',quality:95,timeout:180000});console.log(t,Date.now()-a);}}finally{await browser.close();closeServer()}
