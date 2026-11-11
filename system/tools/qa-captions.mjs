// Check reported critical text/brand boxes and, for narrated films, burned-in captions.
import { safeArea } from '../lib/safeArea.js';
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const D=path.resolve(process.argv[2]), F=JSON.parse(fs.readFileSync(path.join(D,'film.json'),'utf8'));
const LIB=process.env.LIB||path.join(process.env.HOME||process.env.USERPROFILE,'lemo-opuscar');
const {openDemo,closeServer}=await import(pathToFileURL(path.join(LIB,'core/render/page.mjs')).href);
const TL=JSON.parse(fs.readFileSync(path.join(D,'timeline.json'),'utf8')), [W,H]=F.size.split('x').map(Number);
const area=safeArea(W,H,F.safe_zone), contentOnly=F.narration===false && F.captions_required!==true;
const res={mode:contentOnly?'content-only':'captions-and-content',samples:0,outsideSafe:[],outsideContentSafe:[],overlaps:[],noBox:0,perCue:[]};
const {browser,page}=await openDemo(D,{w:W,h:H,q:'',warnings:true});
const outside=b=>![b.x0,b.y0,b.x1,b.y1].every(Number.isFinite)||b.x0<area.x0-4||b.x1>area.x1+4||b.y0<area.y0-4||b.y1>area.y1+4;
try{
 for(const c of (contentOnly?TL.scenes:TL.cues)){
  let n=0,mx=0;
  for(let t=c.t0+.3;t<c.t1-.3;t+=1/12){
   const r=await page.evaluate(t=>{window.render(t);return{cap:window.__capBox,tx:window.TEXTS(t)}},t);
   res.samples++;n++;
   for(const x of r.tx)if((!x.pass||['brand','series','seriesnext'].includes(String(x.id)))&&outside(x))res.outsideContentSafe.push({t:+t.toFixed(2),id:x.id,text:x.text,box:x});
   if(contentOnly)continue;
   if(!r.cap){res.noBox++;continue;}
   const b=r.cap;mx=Math.max(mx,b.x1-b.x0);
   if(outside(b))res.outsideSafe.push({t:+t.toFixed(2),box:b});
   for(const x of r.tx)if(!x.pass&&x.role!=='caption'&&x.x0<b.x1&&x.x1>b.x0&&x.y0<b.y1&&x.y1>b.y0)res.overlaps.push({t:+t.toFixed(2),id:x.id,text:x.text});
  }
  res.perCue.push({id:c.id,samples:n,widestPx:Math.round(mx)});
 }
}finally{await browser.close();closeServer();}
fs.mkdirSync(path.join(D,'out'),{recursive:true});fs.writeFileSync(path.join(D,'out/qa-captions.json'),JSON.stringify(res,null,2));
console.log(JSON.stringify({mode:res.mode,samples:res.samples,outsideSafe:res.outsideSafe.length,outsideContentSafe:res.outsideContentSafe.length,overlapsWithOtherText:res.overlaps.length,noBoxWhileCueActive:res.noBox,firstProblems:[...res.outsideSafe,...res.outsideContentSafe,...res.overlaps].slice(0,3)}));
if(!res.samples||res.noBox||res.outsideSafe.length||res.outsideContentSafe.length||res.overlaps.length||res.perCue.some(c=>!c.samples))process.exitCode=1;
