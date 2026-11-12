import * as T from 'three';
import {RoundedBoxGeometry} from './assets/RoundedBoxGeometry.js';
import {RoomEnvironment} from './assets/RoomEnvironment.js';
const W=1080,H=1920,scene=new T.Scene(),canvas=document.querySelector('#world');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setSize(W,H);renderer.setPixelRatio(2);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
scene.background=new T.Color('#ecebe5');scene.fog=new T.Fog('#ecebe5',25,70);
const envGen=new T.PMREMGenerator(renderer);scene.environment=envGen.fromScene(new RoomEnvironment(),.04).texture;envGen.dispose();
const cam=new T.PerspectiveCamera(33,W/H,.1,100),V=(x,y,z)=>new T.Vector3(x,y,z),sm=(a,b,t)=>{let u=Math.min(1,Math.max(0,(t-a)/(b-a)));return u*u*(3-2*u)},mix=T.MathUtils.lerp;
const hemi=new T.HemisphereLight('#fffaf1','#aeb6ae',1.5);scene.add(hemi);
const key=new T.DirectionalLight('#fff8e8',3);key.position.set(-7,12,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:40});key.shadow.bias=-.0004;key.shadow.normalBias=.025;key.shadow.radius=4;scene.add(key);
const rim=new T.DirectionalLight('#d8e6ff',2);rim.position.set(8,5,-6);scene.add(rim);
const floor=new T.Mesh(new T.PlaneGeometry(150,150),new T.MeshStandardMaterial({color:'#e9e7df',roughness:.82}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.7;floor.receiveShadow=true;scene.add(floor);
const ceramic=new T.MeshPhysicalMaterial({color:'#f7f4e9',metalness:.08,roughness:.24,clearcoat:1,clearcoatRoughness:.2});
const orange=new T.MeshPhysicalMaterial({color:'#d64217',metalness:.12,roughness:.25,clearcoat:1});
const chrome=new T.MeshStandardMaterial({color:'#b9c4c6',metalness:1,roughness:.19});
const ink=new T.MeshStandardMaterial({color:'#263430',metalness:.25,roughness:.3});
const glass=new T.MeshPhysicalMaterial({color:'#e8f4ed',transmission:.85,roughness:.08,thickness:.45,ior:1.45,metalness:0});
function mesh(geo,mat,parent=scene){const m=new T.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(x,y,z,mat,parent){return mesh(new RoundedBoxGeometry(x,y,z,4,.16),mat,parent)}
const stage=new T.Group();scene.add(stage);
const base=box(10.6,.65,6.5,ceramic,stage);base.position.y=-2.3;
const core=new T.Group();stage.add(core);const seed=mesh(new T.IcosahedronGeometry(1.4,3),orange,core);seed.scale.set(1,.95,1);
const cuts=[];for(let i=0;i<3;i++){const g=new T.Group();core.add(g);const tor=mesh(new T.TorusGeometry(1.63,.1,12,96),i===1?ceramic:chrome,g);g.rotation.set(i*.63,.45+i*.5,.25);cuts.push(g)}
const sensor=mesh(new T.SphereGeometry(.22,24,12),chrome,core);sensor.position.set(0,.85,1.1);
const orbiters=[];for(let i=0;i<8;i++){const m=mesh(new T.SphereGeometry(.13,16,12),chrome,core);orbiters.push(m);}
const machines=[];for(let i=0;i<3;i++){const g=new T.Group();stage.add(g);g.position.set((i-1)*3.45,-1.7,0);const b=box(2.6,.38,2.7,ceramic,g);const inset=box(2.18,.12,2.22,ink,g);inset.position.y=.25;const r=mesh(new T.TorusGeometry(.72,.07,10,64),orange,g);r.rotation.x=-Math.PI/2;r.position.y=.4;const arm=box(.35,1.5,.35,chrome,g);arm.position.set(.85,1.05,.7);const paddle=box(1.65,.2,.8,ceramic,g);paddle.position.set(0,1.8,.7);machines.push({g,r,arm,paddle})}
const guides=[];for(let i=0;i<2;i++){const a=(i-1)*3.45;const path=new T.CatmullRomCurve3([V(a,-1.12,1.6),V(a+1.2,-.8,2.35),V(a+2.6,-.8,2.35),V(a+3.45,-1.12,1.6)]);const tube=mesh(new T.TubeGeometry(path,48,.045,8,false),orange,stage);const bead=mesh(new T.SphereGeometry(.14,16,12),orange,stage);guides.push({path,tube,bead})}
let lastTime=-1;function render(t){if(t===lastTime)return;lastTime=t;const section=Math.min(3,Math.floor(t/3)),u=(t-section*3)/3;
 stage.rotation.y=.1;stage.position.set(0,0,0);base.scale.set(1,1,1);machines.forEach(({g,r,arm,paddle},i)=>{g.scale.setScalar(1);g.position.y=-1.7;r.rotation.z=t*.6+i*.4;r.scale.setScalar(1);arm.scale.y=1;paddle.position.y=1.8});
 let radius,angle,cy;
 if(section===0){radius=mix(19,18.5,sm(0,1,u));angle=mix(-.35,.1,u);cy=8;core.position.set(0,1.15,0);core.scale.setScalar(1.15);base.scale.setScalar(.3);machines.forEach(({g})=>g.scale.setScalar(0));}
 if(section===1){radius=mix(35,33,sm(0,1,u));angle=.45+u*.28;cy=mix(13,15,u);core.position.set(0,2.1,0);core.scale.setScalar(.95);machines.forEach(({g},i)=>{g.scale.setScalar(sm(3+i*.14,3.8+i*.14,t));g.position.y=-1.7+.32*Math.sin(Math.PI*sm(3+i*.12,4+i*.12,t))});}
 if(section===2){radius=23;angle=.75-u*.32;cy=11;const p=sm(6.1,8.7,t);core.position.set(mix(-3.45,3.45,p),1.05+.18*Math.sin(t*7),0);core.scale.setScalar(.72);machines.forEach(({paddle,arm,r},i)=>{const act=sm(6+i*.8,6.5+i*.8,t)*(1-sm(7+i*.8,7.5+i*.8,t));paddle.position.y=1.8-.65*act;arm.scale.y=1-.35*act;r.scale.setScalar(1+.15*act)});}
 if(section===3){radius=mix(21,18.5,sm(0,1,u));angle=.3-u*.4;cy=10;const s=sm(9,9.6,t);core.position.set(mix(3.45,0,s),mix(1.05,1.7,s),0);core.scale.setScalar(mix(.72,1.25,s));machines.forEach(({g},i)=>{g.position.x=mix((i-1)*3.45,(i-1)*2.6,s);g.position.z=-1.8*s;g.scale.setScalar(1-.2*s)});}
 if(section<3)machines.forEach(({g},i)=>{g.position.x=(i-1)*3.45;g.position.z=0});
 core.rotation.set(.07*Math.sin(t*.8),t*.38,.1);seed.rotation.y=-t*.25;
 cuts.forEach((g,i)=>{g.rotation.x=i*.63+t*.15;g.rotation.y=.45+i*.5+t*.12;g.position.y=(section===1?.35*Math.sin(u*Math.PI):0)*(i-1)});
 orbiters.forEach((m,i)=>{const a=i*Math.PI/4+t*.45;m.position.set(Math.cos(a)*2,.2*Math.sin(a*2),Math.sin(a)*2)});
 guides.forEach(({tube,bead,path},i)=>{tube.visible=section>0;bead.visible=section>0;bead.position.copy(path.getPoint(((t*.6+i*.3)%1)));});
 const targetX=section===2?core.position.x:0;cam.position.set(targetX+Math.sin(angle)*radius,cy,Math.cos(angle)*radius);cam.lookAt(targetX+.3,section===3?1.3:.8,0);cam.updateProjectionMatrix();renderer.render(scene,cam);window.sceneReady=true;}
window.renderScene=render;addEventListener('hf-seek',e=>render(e.detail.time));await document.fonts.ready;render(window.__hfThreeTime||window.filmClock.t||0);
