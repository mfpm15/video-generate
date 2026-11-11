import { drawCaption } from './_lib/captions.js';
import * as E from './engine.js';
import { drawBrand, loadBrand } from './_lib/brand.js';
const F=await (await fetch('film.json')).json(), TL=await (await fetch('timeline.json')).json(), BR=await loadBrand();
const W=innerWidth,H=innerHeight,k=W/1080, cv=document.getElementById('c');cv.width=W;cv.height=H;const g=cv.getContext('2d');
E.setAccent('#BAFD40');
await Promise.all(['500 36px Inter','700 72px Inter','800 120px Inter','600 32px JBMono','800 400px InterTight'].map(f=>document.fonts.load(f)));await document.fonts.ready;
const A=E.PAL.accent, clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), ease=v=>1-(1-clamp(v))**3;
let boxes=[];
function text(s,x,y,px=36,color='#f0f3f8',wt=600,id=null,pass=false){g.font=`${wt} ${px}px Inter`;g.fillStyle=color;g.textAlign='left';g.textBaseline='alphabetic';g.fillText(s,x,y);const m=g.measureText(s);boxes.push({id:id||s,text:s,x0:x,y0:y-px*.84,x1:x+m.width,y1:y+px*.16,pass});}
function mono(s,x,y,px=24,color='#8f99aa'){g.font=`500 ${px}px JBMono`;g.fillStyle=color;g.fillText(s,x,y);}
function cursor(x,y,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);const p=new Path2D('M0 0L0 64L17 47L30 76L42 70L29 42L54 42Z');g.shadowColor=E.rgba(A,.35);g.shadowBlur=22;g.fillStyle=A;g.fill(p);g.restore();}
function panel(x,y,w,h,active=false){E.panel(g,x,y,w,h,{r:26,fill:active?'#1b2418':'#111721',stroke:active?E.rgba(A,.65):'rgba(255,255,255,.1)',shadow:1});}
function check(x,y,p){g.save();g.strokeStyle=A;g.lineWidth=6;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(x,y+12);g.lineTo(x+12*clamp(p*2),y+12+12*clamp(p*2));if(p>.5)g.lineTo(x+12+24*(p-.5)*2,y+24-30*(p-.5)*2);g.stroke();g.restore();}
function heading(s){text(s,112,475,66,'#f4f7fc',700,'headline');}
function scene(i,t){
 if(i===0){heading('Bukan sekadar chat.');
  for(let n=0;n<5;n++){const p=ease((t-n*.08)/.55),x=136+n*25,y=650+n*80;g.save();g.translate(0,(1-p)*180);g.rotate((1-p)*(n-2)*.018);panel(x,y,640,170,n===4);g.globalAlpha=.4+n*.13;mono(['IDE','CATATAN','RISET','RENCANA','AKSI'][n],x+32,y+53);g.fillStyle='#344052';g.fillRect(x+32,y+80,250+n*43,8);g.fillRect(x+32,y+106,160+n*29,8);g.restore();}
  const p=ease((t-.4)/1);cursor(785-130*p,1140-150*p,1.1);
 }else if(i===1){heading('Satu tujuan.');
  E.glow(g,500,900,430,A,.07);g.font='800 390px InterTight';g.fillStyle='#f1f4f9';g.textAlign='center';g.fillText('01',498,990);g.textAlign='left';boxes.push({id:'one',text:'01',x0:265,y0:660,x1:735,y1:1030});
  panel(155,1090,690,120,true);text('Buat sesuatu yang berguna.',188,1168,37,'#eaf5d8',600,'goal');
 }else if(i===2){heading('Pecah jadi langkah.');
  const labels=['Pahami tujuan','Susun rencana','Pilih alat'];
  labels.forEach((s,n)=>{const p=ease((t-n*.18)/.7),to={x:150,y:650+n*210},from={x:n%2?-460:1240,y:to.y-160};const pos=E.flyPose(from,to,p);g.save();g.translate(pos.x,pos.y);panel(0,0,700,160,n===Math.min(2,Math.floor(t)));mono('0'+(n+1),30,55,24);g.restore();if(p>.99)text(s,232,to.y+100,45,'#eef2f8',600,'plan'+n);});
  cursor(775,1205-240*ease(t/2.4),.8);
 }else if(i===3){heading('Jalankan. Periksa.');panel(135,625,735,610);
  mono('AGENT / WORKSPACE',174,686,26);const labels=['Tugas dipahami','Aksi dijalankan','Hasil diperiksa'];
  labels.forEach((s,n)=>{const y=775+n*155,p=clamp((t-.25-n*.55)/.42);g.strokeStyle='rgba(255,255,255,.07)';g.beginPath();g.moveTo(175,y+66);g.lineTo(825,y+66);g.stroke();text(s,196,y+24,39,'#d9e0ea',500,'run'+n);check(770,y-3,p);});
  mono('DEMO KONSEPTUAL',173,1193,22,'#69778b');
 }else{heading('Kamu mengarahkan.');const p=ease(t/.7),s=1+.07*(1-p);g.save();g.translate(498,910);g.scale(s,s);panel(-330,-170,660,340,true);E.glow(g,0,0,300,A,.08);g.font='700 76px Inter';g.fillStyle='#f0f6e5';g.textAlign='center';g.fillText('AI AGENT',0,-15);g.font='500 30px Inter';g.fillStyle='#a3b09a';g.fillText('Tujuanmu. Rangkaian aksinya.',0,55);g.restore();boxes.push({id:'end',text:'AI AGENT',x0:268,y0:830,x1:730,y1:926});cursor(820,1130,.75);}
}
function render(t){boxes=[];g.setTransform(1,0,0,1,0,0);E.bg(g,{lift:1,cool:1});E.grid(g,{module:48});E.vignette(g,.35);g.save();g.scale(k,H/1920);
 const i=t<3.2?0:t<6.8?1:t<10.4?2:t<14?3:4,starts=[0,3.2,6.8,10.4,14];scene(i,t-starts[i]);
 // Transition comes from an expanding/collapsing real UI surface, not a blank fade.
 const age=t-starts[i];if(i>0&&age<.28){const q=1-ease(age/.28);g.save();g.translate(500,900);g.scale(1+q*1.1,1+q*1.2);g.globalAlpha=q;panel(-360,-390,720,780);g.restore();}
 g.restore();boxes=boxes.map(b=>({...b,x0:b.x0*k,x1:b.x1*k,y0:b.y0*H/1920,y1:b.y1*H/1920}));
 boxes.push(...drawBrand(g,{W,H,t,TL,F,P:{family:'Inter',accent:A},BR}).map(b=>({...b,pass:true})));g.fillStyle=E.rgba(A,.6);g.fillRect(76,H*.706,(W*.77)*clamp(t/18),3);const cap=drawCaption(g,t,{effect:'01',W,H,timeline:TL,safeZone:F.safe_zone,theme:{family:'Inter',accent:A,text:'#f1f4f8'}});window.__capBox=cap;const cue=TL.cues.find(c=>t>=c.t0&&t<c.t1);if(cap&&cue)boxes.push({id:'caption-'+cue.id,text:cue.text,...cap,role:'caption'});
}
window.DUR=18;window.EV=[];window.render=render;window.TEXTS=t=>{render(t);return boxes;};window.READY=true;
