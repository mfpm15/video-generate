import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeStudio } from './studio.js';
import { glass, guideMat, setPulses } from './reference-product.js';
const W=1080,H=1920,DUR=12,Q=new URLSearchParams(location.search), V=(x,y,z)=>new THREE.Vector3(x,y,z);
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},seg=(t,a,b)=>smooth((t-a)/(b-a)),mix=(a,b,t)=>a+(b-a)*t;
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setPixelRatio(2);renderer.setSize(W,H);renderer.domElement.style.width=W+'px';renderer.domElement.style.height=H+'px';renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.12;document.getElementById('stage').appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(29,W/H,1,1800),studio=makeStudio(renderer,scene);
studio.floor.visible=false;const floor=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshPhysicalMaterial({color:'#080c12',roughness:.3,metalness:.6}));floor.rotation.x=-Math.PI/2;floor.position.y=-15;floor.visible=false;scene.add(floor);let envBaked=false;
const metal=(c='#cad5df',r=.23)=>new THREE.MeshPhysicalMaterial({color:c,metalness:1,roughness:r,envMapIntensity:1.3});
const brushed=document.createElement('canvas');brushed.width=brushed.height=256;const bg=brushed.getContext('2d');bg.fillStyle='#808080';bg.fillRect(0,0,256,256);for(let i=0;i<256;i++){bg.strokeStyle=i%3?'#777':'#999';bg.beginPath();bg.moveTo(i,0);bg.lineTo(i+6,256);bg.stroke()}const rt=new THREE.CanvasTexture(brushed);
const titanium=metal('#b8c8d7',.24);titanium.roughnessMap=rt;const graphite=metal('#242a32',.3),chrome=metal('#d9e3ec',.17);
const root=new THREE.Group();root.position.y=29;scene.add(root);
const axis=V(-.15,.8,.58).normalize(),orientation=new THREE.Quaternion().setFromUnitVectors(V(0,1,0),axis);
const assembly=new THREE.Group();assembly.quaternion.copy(orientation);root.add(assembly);
const pieces=[];function piece(obj,y,offset){const g=new THREE.Group();g.add(obj);g.position.y=y;assembly.add(g);pieces.push({g,y,offset});return g;}
const shell=new THREE.Mesh(new THREE.TorusGeometry(14.8,1.2,16,96),glass({thickness:2.4,side:THREE.DoubleSide}));shell.rotation.x=Math.PI/2;piece(shell,2,19);
const crown=new THREE.Mesh(new THREE.TorusGeometry(14.8,.65,16,100),chrome);crown.rotation.x=Math.PI/2;piece(crown,2,14);
const coreMat=new THREE.MeshPhysicalMaterial({color:'#12252f',metalness:.65,roughness:.23,emissive:'#10232c',emissiveIntensity:.1});
const chip=new THREE.Mesh(new RoundedBoxGeometry(12,2.8,12,3,.8),coreMat);const core=piece(chip,1,8);
const small=new THREE.Group();const lines=new THREE.Group();
for(let i=0;i<8;i++){const a=i*Math.PI/4;const trace=new THREE.Mesh(new THREE.BoxGeometry(.14,.08,9),metal('#bb9c61',.35));trace.position.set(Math.sin(a)*6,1.55,Math.cos(a)*6);trace.rotation.y=a;small.add(trace);const dot=new THREE.Mesh(new THREE.SphereGeometry(.8,12,8),chrome);dot.position.set(Math.sin(a)*10,1.7,Math.cos(a)*10);small.add(dot)}core.add(small);const mind=new THREE.Mesh(new THREE.IcosahedronGeometry(3.4,1),new THREE.MeshPhysicalMaterial({color:'#b9cdd8',roughness:.15,metalness:.6,emissive:'#1b5264',emissiveIntensity:.5}));mind.position.y=3.2;core.add(mind);
const ringM=guideMat(true),ring=new THREE.Mesh(new THREE.TorusGeometry(10.8,.32,12,128),ringM);ring.rotation.x=Math.PI/2;piece(ring,-1,1);
const board=new THREE.Mesh(new THREE.CylinderGeometry(13,13,1.6,96),titanium);piece(board,-3,-7);
const base=new THREE.Mesh(new THREE.CylinderGeometry(12,10.7,2.2,96),graphite);piece(base,-5,-15);
const nodes=[],paths=[];const orbit=new THREE.Group();root.add(orbit);
for(let i=0;i<6;i++){const a=i*Math.PI/3;const p=V(Math.sin(a)*24,Math.sin(a*2)*6,Math.cos(a)*24);const node=new THREE.Group();node.position.copy(p);const m=new THREE.Mesh(new THREE.SphereGeometry(2.3,24,16),titanium);node.add(m);const haloM=guideMat(true),halo=new THREE.Mesh(new THREE.TorusGeometry(2.5,.14,8,48),haloM);halo.rotation.x=Math.PI/2;node.add(halo);orbit.add(node);nodes.push({node,p,m:haloM});const curve=new THREE.CatmullRomCurve3([V(0,0,0),p.clone().multiplyScalar(.35).add(V(0,9,0)),p.clone().multiplyScalar(.75).add(V(0,7,0)),p]);const mat=guideMat(false),tube=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.1,6,false),mat);orbit.add(tube);paths.push({mat,tube})}
const kickTimes=[.35,1.1,2.05,3.35,4.1,4.85,5.6,6.35,7.1,7.85,8.6,9.15,9.4,10.15,11.05];
const ov=document.getElementById('ov'),g=ov.getContext('2d');let boxes=[];
await document.fonts.load('200 100px InterTight');await document.fonts.load('300 44px InterTight');await document.fonts.load('500 25px Inter');
const captions=[{t0:0,t1:3,text:'Mulai dari satu ide.'},{t0:3,t1:6,text:'Susun langkahnya.'},{t0:6,t1:9,text:'Jalankan bersama.'},{t0:9,t1:12,text:'Kamu tentukan arah.'}];
function text(s,x,y,font,spacing=0,alpha=1){g.save();g.font=font;g.letterSpacing=spacing+'px';g.textAlign='center';g.textBaseline='middle';g.globalAlpha=alpha;g.fillStyle='#eaf4fb';g.fillText(s,x,y);const b=g.measureText(s);boxes.push({id:s,text:s,x:x-b.width/2,y:y-parseInt(font.split(' ')[1])/2,w:b.width,h:parseInt(font.split(' ')[1])});g.restore()}
function hud(t){g.clearRect(0,0,W,H);boxes=[];text('ngetehnology',500,269,'400 25px Inter',1,.72);text('AI AGENT',500,357,'200 86px InterTight',12);text('DARI IDE KE AKSI',500,437,'400 23px InterTight',7,.66);
const cue=captions.find(c=>t>=c.t0&&t<c.t1);if(cue){const a=seg(t,cue.t0,cue.t0+.16)*(1-seg(t,cue.t1-.15,cue.t1));g.save();g.globalAlpha=a;g.font='300 43px InterTight';const pw=g.measureText(cue.text).width+102,ph=96,x=500-pw/2,y=1290;g.beginPath();g.roundRect(x,y,pw,ph,32);g.save();g.clip();g.filter='blur(18px) brightness(1.4)';g.drawImage(renderer.domElement,x*2,y*2,pw*2,ph*2,x,y,pw,ph);g.filter='none';g.fillStyle='rgba(190,220,240,.14)';g.fillRect(x,y,pw,ph);g.restore();g.strokeStyle='rgba(215,239,255,.45)';g.lineWidth=1.2;g.stroke();g.strokeStyle='#71dfff';g.beginPath();g.moveTo(x+32,y+1);g.lineTo(x+pw-32,y+1);g.stroke();text(cue.text,500,y+48,'300 43px InterTight',0,a);boxes.pop();boxes.push({id:'caption',text:cue.text,x,y,w:pw,h:ph,role:'caption'});g.restore()}

}
function frame(t){if(Q.has('measure')){hud(t);return;}const section=Math.min(3,Math.floor(t/3)),u=(t-section*3)/3;let explode=0,pos,look=V(0,29,0),focus=look.clone(),aper=200;
root.rotation.y=.15+Math.sin(t*.15)*.16;root.rotation.z=.04*Math.sin(t*.5);
if(section===0){explode=.05;const az=mix(-.7,-.34,smooth(u));const d=mix(143,129,smooth(u));pos=V(Math.sin(az)*d,70,Math.cos(az)*d);look=V(0,31,0);focus=V(0,34,4);aper=550;orbit.visible=false;}
if(section===1){explode=seg(t,3,4.4);const az=mix(.1,.62,smooth(u)),d=mix(220,207,smooth(u));pos=V(Math.sin(az)*d,104,Math.cos(az)*d);orbit.visible=false;}
if(section===2){explode=.9;const az=mix(.52,1.04,smooth(u)),d=mix(238,230,smooth(u));pos=V(Math.sin(az)*d,100,Math.cos(az)*d);orbit.visible=true;const s=seg(t,6,6.8);orbit.scale.setScalar(s);}
if(section===3){explode=(1-seg(t,9,9.32))*.9;const az=mix(-.32,.2,smooth(u)),d=mix(180,166,smooth(u));pos=V(Math.sin(az)*d,70,Math.cos(az)*d);orbit.visible=true;orbit.scale.setScalar(1-seg(t,9,9.38));}
for(const {g,y,offset} of pieces){g.position.y=y+offset*explode;g.rotation.y=offset*.015*explode+Math.sin(t*.6)*.025;g.rotation.z=offset*.004*explode;}
assembly.rotation.y=.1+t*.16;core.rotation.y=.12*t;
const hits=kickTimes.filter(k=>t>=k&&t-k<1.7);const pulse=hits.reduce((s,k)=>s+Math.exp(-(t-k)/.25),0);
setPulses(ringM,hits.slice(-4).map((k,i)=>({p:(t-k)*.7+i*.25,w:.025,a:5*Math.exp(-(t-k)/.7),h:(t-k)*.4})),.015);
for(let i=0;i<6;i++){const p=paths[i],age=((t-6-i*.1)%1.2+1.2)%1.2;setPulses(p.mat,section>=2?[{p:age/1.2,w:.055,a:6,h:age*.6}]:[],.005);setPulses(nodes[i].m,section>=2?[{p:t*.8+i/6,w:.09,a:2.5,h:.2}]:[],.01);nodes[i].node.rotation.y=t*.35+i;}
look.x=3;camera.position.copy(pos);camera.lookAt(look);camera.updateProjectionMatrix();const az=Math.atan2(pos.x,pos.z),sw=(t*1.1)%2-1;
if(!envBaked){studio.updateEnv({left:1.4,right:1.3,top:1.5,front:.2,back:1.6,key:.8,sweep:{I:0},aura:{I:0}});envBaked=true;}
scene.backgroundIntensity=.55;studio.U.uBgI.value=.55;studio.U.uRes.value.set(W*2,H*2);studio.U.uTime.value=t*.65;studio.U.uSpot.value=.04;studio.U.uC.value[0].set(0,0,25,.25+pulse*.13);studio.U.uC.value[1].set(0,0,1,0);studio.U.uC.value[2].set(0,0,1,0);studio.U.uWave.value.forEach(w=>w.set(0,0,0,0));hits.slice(-5).forEach((k,i)=>studio.U.uWave.value[i].set(0,0,12+(t-k)*40,.3*Math.exp(-(t-k)*2)));

scene.updateMatrixWorld();camera.updateMatrixWorld();renderer.render(scene,camera);hud(t);
}
window.render=frame;window.DUR=DUR;window.SUBS=captions;window.EV=[];window.TEXTS=()=>boxes.map(b=>({...b,x0:b.x,y0:b.y,x1:b.x+b.w,y1:b.y+b.h}));window.READY=true;
