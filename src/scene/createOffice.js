import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { agents, characters } from '../data/characters.js';

const material = (color, roughness = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });


const GROUND=0.05,DESKS=[[-6.7,-3.35],[-3.5,-3.35],[-0.25,-3.35],[3,-4.65],[6.05,-4.65],[9.1,-4.65]],MEET={x:10.6,z:0.1,rx:1.75,rz:1.45};
const MEET_CHAIRS=[45,135,225,315].map(d=>{const a=d*Math.PI/180,x=MEET.x+Math.cos(a)*MEET.rx,z=MEET.z+Math.sin(a)*MEET.rz;return{x,z,face:Math.atan2(MEET.x-x,MEET.z-z),out:[Math.cos(a),Math.sin(a)]};});
const NOOK={x:-11.1,z:-3.4,r:1.4},NOOK_POUFS=[0,120,240].map(d=>{const a=d*Math.PI/180,x=NOOK.x+Math.cos(a)*NOOK.r,z=NOOK.z+Math.sin(a)*NOOK.r;return{x,z,face:Math.atan2(NOOK.x-x,NOOK.z-z),out:[Math.cos(a),Math.sin(a)]};});
const DINE={x:-7.2,z:6.1},DINE_CHAIRS=[{x:-8.2,z:5.5,face:Math.PI/2},{x:-8.2,z:6.7,face:Math.PI/2},{x:-6.2,z:5.5,face:-Math.PI/2},{x:-6.2,z:6.7,face:-Math.PI/2}];
const POOL={x:11.3,z:5.65,iw:2.6,id:3.1},waterMat=new THREE.MeshStandardMaterial({color:'#6fc3d1',roughness:0.1,metalness:0.1,transparent:true,opacity:0.62,emissive:'#2c7f8f',emissiveIntensity:0.25});
const WALLS=[
{axis:'x',c:-0.2,a:-12.9,b:1.4,gaps:[[-5.9,-4.5],[-11.7,-10.3]],h:1.3},
{axis:'z',c:1.4,a:-7.5,b:-0.2,gaps:[[-3.7,-2.3]],h:1.3},
{axis:'x',c:-2.05,a:1.4,b:12.9,gaps:[[3.4,4.8]],h:1.3},
{axis:'z',c:3.1,a:-2,b:5.3,gaps:[[-0.1,1.5],[2.3,3.7]],h:1.3},
{axis:'x',c:2.1,a:3.1,b:8.8,gaps:[[7.4,8.7]],h:1.3},
{axis:'z',c:8.8,a:2.1,b:7.6,gaps:[[4.8,6.2]],h:1.3},
{axis:'x',c:4.3,a:-12.9,b:-9.9,gaps:[],h:2.1},
{axis:'z',c:-9.9,a:4.3,b:7.6,gaps:[[5.1,6.5]],h:1.3,style:'frost'},
{axis:'x',c:7.6,a:-12.9,b:-9.9,gaps:[],h:1,style:'frost'},
{axis:'z',c:-9.9,a:1,b:4.3,gaps:[],h:1.3},
{axis:'x',c:4.1,a:-9.9,b:-4.55,gaps:[[-8.6,-7.2]],h:1.2},
{axis:'z',c:-4.55,a:1.4,b:7.6,gaps:[[4.9,6.3]],h:1.3}];
const wallSegments=w=>{const pts=[w.a,...[...w.gaps].sort((p,q)=>p[0]-q[0]).flat(),w.b],out=[];for(let i=0;i<pts.length-1;i+=2){const s=pts[i],e=pts[i+1],len=e-s;if(len<0.05)continue;const m=(s+e)/2;out.push(w.axis==='x'?{x:m,z:w.c,sx:len,sz:0.1}:{x:w.c,z:m,sx:0.1,sz:len});}return out;};
const BLOCKS=[],blk=(x,z,w,d)=>BLOCKS.push([x,z,w,d]);
DESKS.forEach(([x,z])=>{blk(x,z,2.6,1.25);blk(x,z+1.04,0.8,0.8);});
blk(-1.65,2.5,3.7,1.1);blk(-1.65,3.85,0.8,0.8);blk(-3.75,3.73,0.75,0.7);blk(0.45,3.73,0.75,0.7);
blk(MEET.x,MEET.z,2.1,2.1);MEET_CHAIRS.forEach(c=>blk(c.x,c.z,0.7,0.7));
blk(5.9,-1.12,3.5,1.25);blk(5.9,1.05,2.1,1);blk(8,-1.15,0.7,0.7);blk(5.05,2.55,0.9,0.7);blk(6.75,2.55,0.9,0.7);blk(6.2,4.58,1.9,0.6);blk(4.15,4.2,1.1,1.1);blk(7.9,4.2,1.1,1.1);
blk(-6.6,2.3,4.1,1.4);blk(-7.8,1.35,0.9,0.9);blk(-8.6,-1.6,0.8,2.3);NOOK_POUFS.forEach(p=>blk(p.x,p.z,0.9,0.9));
[[-11.9,-6.45],[11.75,-6.35]].forEach(([x,z])=>blk(x,z,0.7,0.7));blk(DINE.x,DINE.z,0.9,2.2);DINE_CHAIRS.forEach(c=>blk(c.x,c.z,0.6,0.6));
blk(-12.2,4.85,0.7,0.9);blk(-10.7,4.85,1.4,1);blk(-12.55,6.7,0.6,1.2);blk(POOL.x,POOL.z,POOL.iw+0.4,POOL.id+0.4);
BLOCKS.push([-13,-5.15,5.6,0.3],[-15.74,-2.4,0.28,5.6],[-10.43,-4.6,0.28,1.1],[-10.43,-0.2,0.28,1.1],[-15.15,0.28,1.25,0.28],[-11,0.28,1.4,0.28],[-14.65,-4.55,1.35,0.7],[-11.55,-4.55,1.35,0.7],[-13.9,-2.25,2,1.26],[-13.9,-1.3,0.8,0.84]);
function createNav(blocks,walls){
 const X0=-13,Z0=-7.7,CS=0.15,W=Math.ceil(26/CS)+1,H=Math.ceil(15.4/CS)+1,grid=new Uint8Array(W*H),ci=x=>Math.floor((x-X0)/CS),cj=z=>Math.floor((z-Z0)/CS);
 const rect=(cx,cz,w,d)=>{for(let i=Math.max(0,ci(cx-w/2-0.22));i<=Math.min(W-1,ci(cx+w/2+0.22));i++)for(let j=Math.max(0,cj(cz-d/2-0.22));j<=Math.min(H-1,cj(cz+d/2+0.22));j++)grid[j*W+i]=1;};
 blocks.forEach(b=>rect(...b));walls.forEach(w=>wallSegments(w).forEach(s=>rect(s.x,s.z,s.sx,s.sz)));
 for(let i=0;i<W;i++)for(let j=0;j<H;j++){const x=X0+(i+.5)*CS,z=Z0+(j+.5)*CS;if(x< -12.7||x>12.7||z< -7.35||z>7.35)grid[j*W+i]=1;}
 const free=(x,z)=>{const i=ci(x),j=cj(z);return i>=0&&j>=0&&i<W&&j<H&&!grid[j*W+i];},center=(i,j)=>({x:X0+(i+.5)*CS,z:Z0+(j+.5)*CS});
 const nearestCell=(x,z)=>{const i0=ci(x),j0=cj(z);for(let r=0;r<40;r++){let best=null,bd=Infinity;for(let j=j0-r;j<=j0+r;j++)for(let i=i0-r;i<=i0+r;i++){if(Math.max(Math.abs(i-i0),Math.abs(j-j0))!==r||i<0||j<0||i>=W||j>=H||grid[j*W+i])continue;const d=(i-i0)**2+(j-j0)**2;if(d<bd){bd=d;best={i,j};}}if(best)return best;}return null;};
 const clear=(a,b)=>{const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/0.07);for(let k=1;k<n;k++)if(!free(a.x+(b.x-a.x)*k/n,a.z+(b.z-a.z)*k/n))return false;return true;};
 const path=(sx,sz,tx,tz)=>{const s=nearestCell(sx,sz),t=nearestCell(tx,tz);if(!s||!t)return null;const N=W*H,start=s.j*W+s.i,goal=t.j*W+t.i;if(start===goal)return[];const g=new Float32Array(N);g.fill(Infinity);const from=new Int32Array(N);from.fill(-1);const closed=new Uint8Array(N),heap=[],h=id=>Math.hypot(id%W-t.i,Math.floor(id/W)-t.j);
  const push=node=>{heap.push(node);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p].f<=node.f)break;heap[i]=heap[p];i=p;}heap[i]=node;};
  const pop=()=>{if(!heap.length)return null;const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let c=i*2+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return top;};
  g[start]=0;push({id:start,f:h(start)});const dirs=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];let found=false,loops=0;
  while(heap.length&&loops<N*2){loops++;const e=pop();if(!e)break;const cur=e.id;if(closed[cur])continue;if(cur===goal){found=true;break;}closed[cur]=1;const x=cur%W,z=Math.floor(cur/W);for(const[dx,dz,cost]of dirs){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=W||nz>=H)continue;const next=nz*W+nx;if(grid[next]||closed[next])continue;if(dx&&dz&&(grid[z*W+nx]||grid[nz*W+x]))continue;const score=g[cur]+cost;if(score>=g[next])continue;from[next]=cur;g[next]=score;push({id:next,f:score+h(next)});}}
  if(!found)return null;const raw=[];for(let id=goal;id!==-1;id=from[id])raw.push(center(id%W,Math.floor(id/W)));raw.reverse();const smooth=[raw[0]];let a=0;while(a<raw.length-1){let b=raw.length-1;while(b>a+1&&!clear(raw[a],raw[b]))b--;smooth.push(raw[b]);a=b;}return smooth.slice(1);
 };return{free,nearest:(x,z)=>{const p=nearestCell(x,z);return p?center(p.i,p.j):{x,z};},path};
}
const nav=createNav(BLOCKS,WALLS),stations=[];
const st=(tag,spot,approach,o={})=>stations.push({tag,spot,approach:approach||spot,face:0,kind:'stand',seatY:0,pose:'stand',dwell:[5,9],occ:null,...o});
DESKS.forEach(([x,z],i)=>st('desk',[x,z+1.12],[x,z+1.95],{home:i,kind:'sit',seatY:0.76,face:Math.PI,pose:'type',dwell:[18,34]}));
st('boss',[-1.65,3.85],[-1.65,4.9],{kind:'sit',seatY:0.76,face:Math.PI,pose:'type',dwell:[20,35]});
MEET_CHAIRS.forEach(c=>st('meet',[c.x,c.z],[c.x+c.out[0]*0.95,c.z+c.out[1]*0.95],{kind:'sit',seatY:0.65,face:c.face,pose:'chat',dwell:[10,18]}));
[5,6.8].forEach(x=>st('sofa',[x,-1],[x,0.03],{kind:'sit',seatY:0.8,pose:'rest',dwell:[8,14]}));
NOOK_POUFS.forEach(p=>st('pouf',[p.x,p.z],[p.x+p.out[0]*0.9,p.z+p.out[1]*0.9],{kind:'sit',seatY:0.5,face:p.face,pose:'read',dwell:[8,14]}));
DINE_CHAIRS.forEach(c=>st('dine',[c.x,c.z],[c.x+(c.face>0?-0.8:0.9),c.z],{kind:'sit',seatY:0.55,face:c.face,pose:'eat',dwell:[9,14]}));
st('bean',[4.15,4.2],[4.15,5.3],{kind:'sit',seatY:0.6,face:1.39,pose:'play',dwell:[9,14]});st('bean',[7.9,4.2],[7.9,5.3],{kind:'sit',seatY:0.6,face:-1.35,pose:'play',dwell:[9,14]});
st('arcade',[5.05,3.45],null,{face:Math.PI,pose:'play',dwell:[7,12]});st('arcade',[6.75,3.45],null,{face:Math.PI,pose:'play',dwell:[7,12]});
st('coffee',[-6.35,3.5],null,{face:Math.PI,pose:'drink',dwell:[4,6]});st('coffee',[-5.35,3.5],null,{face:Math.PI,pose:'drink',dwell:[3,5]});
st('book',[-7.8,-1.6],null,{face:-Math.PI/2,pose:'read',dwell:[6,10]});st('board',[6.7,-6.6],null,{face:Math.PI,pose:'board',dwell:[5,8]});st('sink',[-11.7,6.7],null,{face:-Math.PI/2,pose:'wash',dwell:[4,6]});st('pool',[POOL.x,POOL.z],[10.4,3.35],{kind:'swim',dwell:[14,22]});
const damp=(a,b,k)=>a+(b-a)*k,angleTo=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),rand=(a,b)=>a+Math.random()*(b-a);
const POSES={stand:(t,s)=>[0,s*0.06],type:(t,s)=>[-1.05+Math.sin(t*9+s*2)*0.05,s*0.12],chat:(t,s)=>[-0.5+Math.sin(t*2.1+s*1.7)*(s>0?0.35:0.14),s*0.25],eat:(t,s)=>s>0?[-1.1-Math.max(0,Math.sin(t*1.6))*0.7,-0.1]:[-0.5,0.15],rest:(t,s)=>[-0.35,s*0.15],play:(t,s)=>[-0.95+Math.sin(t*7+s)*0.08,s*0.1],drink:(t,s)=>s>0?[-1.45-Math.max(0,Math.sin(t*1.2))*0.4,-0.15]:[-0.1,0.05],read:(t,s)=>[-1,s*0.18],board:(t,s)=>s>0?[-2.5+Math.sin(t*3)*0.15,-0.1]:[-0.2,0.08],wash:(t,s)=>[-0.85+Math.sin(t*8+s)*0.1,-s*0.1]};
const TILT={type:0.14,read:0.2,eat:0.1,wash:0.2},WEIGHT={meet:1.2,sofa:1.2,pouf:1,dine:1.3,bean:0.8,arcade:0.7,coffee:1,book:0.5,board:0.5,sink:0.6,pool:1};
const swimYaw=a=>Math.atan2(-Math.sin(a.theta)*a.dir,Math.cos(a.theta)*a.dir),swimPos=(a,th)=>{const yaw=swimYaw(a),cx=POOL.x+Math.cos(th)*0.45,cz=POOL.z+Math.sin(th)*0.45;return{x:cx-Math.sin(yaw)*0.7,z:cz-Math.cos(yaw)*0.7};};
function makeActor(root,rig,o){root.rotation.order='YXZ';return{root,legs:rig.legs,arms:rig.arms,head:rig.head,headTilt:rig.headTilt!==false,home:o.home??null,boss:!!o.boss,speed:o.speed,phase:o.phase,state:'dwell',wait:rand(3,12),st:null,path:[],pi:0,apt:null,v:0,walk:0,sit:0,sitT:0,prone:0,proneT:0,u:0,from:null,yaw:0,seatY:0,arc:0,theta:0,dir:1};}
function seatAt(a,s){if(!s)return;s.occ=a;a.st=s;a.apt=nav.nearest(s.approach[0],s.approach[1]);a.root.position.set(s.spot[0],GROUND,s.spot[1]);a.yaw=s.face;a.seatY=s.seatY;a.sit=a.sitT=s.kind==='sit'?1:0;a.prone=a.proneT=s.kind==='swim'?1:0;a.state='dwell';a.wait=rand(4,14);a.root.rotation.y=a.yaw;}
function pickStation(a){const opts=stations.filter(s=>(!s.occ||s.occ===a)&&s!==a.st&&(s.tag==='desk'?s.home===a.home:s.tag==='boss'?a.boss:true));const w=opts.map(s=>(s.tag==='desk'||s.tag==='boss'?4:WEIGHT[s.tag]??1));if(!opts.length)return null;let r=Math.random()*w.reduce((x,y)=>x+y,0);for(let i=0;i<opts.length;i++){r-=w[i];if(r<=0)return opts[i];}return opts[0];}
function plan(a){if(a.st)a.st.occ=null;for(let n=0;n<6;n++){const s=pickStation(a);if(!s)break;const p=nav.path(a.root.position.x,a.root.position.z,s.approach[0],s.approach[1]);if(!p||!p.length)continue;s.occ=a;a.st=s;a.path=p;a.pi=0;a.apt=p[p.length-1];a.state='walk';return;}a.state='dwell';a.wait=2;}
function walkStep(a,dt){const p=a.root.position,t=a.path[a.pi];if(!t)return true;const dx=t.x-p.x,dz=t.z-p.z,d=Math.hypot(dx,dz),last=a.pi===a.path.length-1;if(d<(last?0.06:0.18)){a.pi++;return a.pi>=a.path.length;}const want=a.speed*(last?Math.min(1,0.35+d/0.9):1);a.v=damp(a.v,want,1-Math.exp(-dt*6));const step=Math.min(a.v*dt,d);p.x+=dx/d*step;p.z+=dz/d*step;a.yaw+=angleTo(a.yaw,Math.atan2(dx,dz))*(1-Math.exp(-dt*9));a.walk+=a.v*dt*5.2;return false;}
function updateActor(a,dt,time){const p=a.root.position,s=a.st,k=1-Math.exp(-dt*8);if(a.state==='walk'){if(walkStep(a,dt)){a.state='in';a.u=0;a.from={x:p.x,z:p.z};a.seatY=s.seatY;a.sitT=s.kind==='sit'?1:0;a.proneT=s.kind==='swim'?1:0;if(s.kind==='swim'){a.theta=Math.atan2(s.approach[1]-POOL.z,s.approach[0]-POOL.x);a.dir=Math.random()<0.5?1:-1;}}}else{a.v=damp(a.v,0,k);if(a.state==='in'){a.u=Math.min(1,a.u+dt/0.8);const e=a.u*a.u*(3-2*a.u),swim=s.kind==='swim',to=swim?swimPos(a,a.theta):{x:s.spot[0],z:s.spot[1]};p.x=a.from.x+(to.x-a.from.x)*e;p.z=a.from.z+(to.z-a.from.z)*e;a.arc=Math.sin(Math.PI*e)*(swim?0.28:0.04);a.yaw+=angleTo(a.yaw,swim?swimYaw(a):s.face)*k;if(a.u>=1){a.state='dwell';a.arc=0;a.wait=rand(s.dwell[0],s.dwell[1]);}}else if(a.state==='dwell'){a.wait-=dt;if(s&&s.kind==='swim'){a.theta+=a.dir*0.9*dt;const q=swimPos(a,a.theta);p.x=q.x;p.z=q.z;a.yaw+=angleTo(a.yaw,swimYaw(a))*k;}else if(s)a.yaw+=angleTo(a.yaw,s.face)*(1-Math.exp(-dt*7));if(a.wait<=0){a.state='out';a.u=0;a.from={x:p.x,z:p.z};a.sitT=0;a.proneT=0;}}else if(a.state==='out'){a.u=Math.min(1,a.u+dt/0.7);const e=a.u*a.u*(3-2*a.u);p.x=a.from.x+(a.apt.x-a.from.x)*e;p.z=a.from.z+(a.apt.z-a.from.z)*e;a.arc=Math.sin(Math.PI*e)*(s.kind==='swim'?0.28:0.04);a.yaw+=angleTo(a.yaw,Math.atan2(a.apt.x-a.from.x,a.apt.z-a.from.z))*k;if(a.u>=1){a.arc=0;plan(a);}}}applyPose(a,dt,time);}
function applyPose(a,dt,time){const k=1-Math.exp(-dt*10),kk=1-Math.exp(-dt*6),r=a.root,s=a.st,moving=Math.min(1,a.v/a.speed)||0;a.sit=damp(a.sit,a.sitT,kk);a.prone=damp(a.prone,a.proneT,kk);const pose=(a.state==='dwell'||a.state==='in')&&s?POSES[s.pose]||POSES.stand:POSES.stand,swing=Math.sin(a.walk)*0.6*moving;a.legs.forEach((leg,i)=>{const kick=Math.sin(time*7+i*Math.PI)*0.3*a.prone;leg.rotation.x=damp(leg.rotation.x,(i?-swing:swing)*(1-a.sit)-1.3*a.sit+kick,k);});a.arms.forEach((arm,i)=>{const side=i?1:-1;let x,z;if(a.prone>0.5){x=-1.5+Math.sin(time*4.2+i*Math.PI)*1.3;z=side*0.1;}else{const q=pose(time+a.phase,side),wx=(i?swing:-swing)*0.85;x=q[0]*(1-moving)+wx*moving;z=q[1]*(1-moving)+side*0.05*moving;}arm.rotation.x=damp(arm.rotation.x,x,k);arm.rotation.z=damp(arm.rotation.z,z,k);});a.head.rotation.y=Math.sin(time*0.55+a.phase)*0.12*(1-moving)*(1-a.prone);if(a.headTilt)a.head.rotation.x=damp(a.head.rotation.x,((s&&TILT[s.pose])||0)*(a.state==='dwell'?1:0)*(1-a.prone)-1.1*a.prone,k);const bob=Math.abs(Math.sin(a.walk))*0.035*moving+(moving<0.1?Math.sin(time*1.4+a.phase)*0.008:0);r.position.y=GROUND+a.sit*(a.seatY-0.5-GROUND)+a.prone*(0.36-GROUND)+bob+a.arc;r.rotation.y=a.yaw;r.rotation.x=a.prone*1.45+moving*0.05;r.rotation.z=Math.sin(a.walk)*0.025*moving;}
function separate(list,dt){for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const A=list[i],B=list[j],pa=A.root.position,pb=B.root.position;if(A.state!=='walk'&&B.state!=='walk')continue;const dx=pb.x-pa.x,dz=pb.z-pa.z,d=Math.hypot(dx,dz);if(d>0.6||d<0.001)continue;const push=(0.6-d)*Math.min(1,dt*6)*(A.state==='walk'&&B.state==='walk'?0.5:1),ux=dx/d,uz=dz/d;if(A.state==='walk'&&nav.free(pa.x-ux*push,pa.z-uz*push)){pa.x-=ux*push;pa.z-=uz*push;}if(B.state==='walk'&&nav.free(pb.x+ux*push,pb.z+uz*push)){pb.x+=ux*push;pb.z+=uz*push;}}}

export function createOffice(host, { onSelect } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d8d9cc');
  scene.fog = new THREE.Fog('#d8d9cc', 45, 86);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(34, 26, 40);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.domElement.className = 'office-canvas';
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 12;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.set(0, 1.0, 4.7);

  scene.add(new THREE.HemisphereLight('#fff7eb', '#65715d', 1.05));
  const sun = new THREE.DirectionalLight('#fff1da', 1.85);
  sun.position.set(-7, 15, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const warmFill = new THREE.PointLight('#ffd5a0', 0.2, 18);
  warmFill.position.set(0, 5, 0);
  scene.add(warmFill);

  const mats = {
    grass: material('#93a57d'),
    floor: material('#cdbda2'),
    wall: material('#dfd4c3'),
    wood: material('#b77e52'),
    woodLight: material('#c89a68'),
    darkWood: material('#80563d'),
    green: material('#88a47d'),
    leaf: material('#5f8966'),
    leafLight: material('#9aba83'),
    fabric: material('#cdb095'),
    sofa: material('#76958a'),
    terracotta: material('#d68c6a'),
    cream: material('#faf4e7'),
    metal: material('#6d7777', 0.38, { metalness: 0.4 }),
    screen: material('#253d42', 0.3, { emissive: '#6a9d9c', emissiveIntensity: 0.28 }),
    glass: new THREE.MeshStandardMaterial({ color: '#a9c7c0', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.33 }),
    bathTile: material('#e3e8dd', 0.7),
    poolWater: material('#76bdbb', 0.22, { metalness: 0.16, transparent: true, opacity: 0.92 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#ffdf99', emissive: '#ffc45f', emissiveIntensity: 0.45 }),
    white: material('#fffaf1'),
    navy: material('#384c55'),
  };

  const box = (parent, name, size, pos, mat, opts = {}) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
    mesh.name = name || '';
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = opts.castShadow !== false;
    mesh.receiveShadow = opts.receiveShadow !== false;
    if (opts.rotation) mesh.rotation.set(opts.rotation[0], opts.rotation[1], opts.rotation[2]);
    parent.add(mesh);
    return mesh;
  };
  const sphere = (parent, name, radius, pos, mat, scale = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 9), mat);
    mesh.name = name || '';
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (parent, name, rt, rb, h, pos, mat, sides = 10) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, sides), mat);
    mesh.name = name || '';
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const group = (parent, name, pos = [0, 0, 0]) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(pos[0], pos[1], pos[2]);
    parent.add(g);
    return g;
  };

  // Floating patch of grass and a slightly raised wooden floor.
  box(scene, 'garden platform', [48, 0.36, 38], [0, -0.28, 4.0], mats.grass);
  box(scene, 'wood floor', [32, 0.22, 19.4], [0, -0.02, 1.25], mats.floor);
  box(scene, 'front step', [8.5, 0.22, 0.82], [0, -0.12, 11.25], mats.woodLight);
  // Wide circulation spine connects the office zones without squeezing agents.
  box(scene, 'central corridor runner', [28.5, 0.035, 2.0], [0, 0.105, 0.75], material('#b8b29b'));
  box(scene, 'garden path to pool', [5.4, 0.06, 4.2], [14.2, 0.025, 12.25], material('#b8b29b'));

  // Expanded dollhouse shell: the front stays open, with a wider wing for the team.
  box(scene, 'back wall', [32, 4.3, 0.22], [0, 2.1, -8.22], mats.wall);
  box(scene, 'left wall', [0.22, 4.3, 19.4], [-16.02, 2.1, 1.25], mats.wall);
  box(scene, 'right low wall', [0.22, 1.3, 19.4], [16.02, 0.65, 1.25], mats.wall);
  box(scene, 'back wood trim', [32.2, 0.2, 0.32], [0, 4.22, -8.18], mats.woodLight);
  box(scene, 'left wood trim', [0.32, 0.2, 19.5], [-16.02, 4.22, 1.25], mats.woodLight);
  box(scene, 'right wood trim', [0.32, 0.2, 19.5], [16.02, 4.22, 1.25], mats.woodLight);

  // A wider window wall makes the office feel bright instead of boxed in.
  box(scene, 'window glass', [10.8, 2.45, 0.09], [-3.1, 2.55, -8.04], mats.glass, { castShadow: false });
  for (let i = 0; i < 6; i++) box(scene, 'window mullion', [0.09, 2.55, 0.12], [-8.05 + i * 2.0, 2.55, -7.94], mats.woodLight);
  box(scene, 'window sill', [10.95, 0.12, 0.22], [-3.1, 1.25, -7.87], mats.wood);
  const landscape = group(scene, 'outside landscape', [0, 0, -10.1]);
  sphere(landscape, 'hill', 3.5, [-5, 0.7, 0], material('#d4cf9c'), [1.4, 0.35, 0.14]);
  sphere(landscape, 'hill', 4, [1.5, 0.5, -0.1], material('#a7bd96'), [1.1, 0.35, 0.14]);
  sphere(landscape, 'hill', 3, [6, 0.8, 0], material('#e4c49b'), [1.4, 0.35, 0.14]);

  // Structural accent beams and a few indoor plants.
  box(scene, 'beam one', [0.12, 3.9, 0.14], [-11.8, 2, -7.24], mats.wood);
  box(scene, 'beam two', [0.12, 3.9, 0.14], [2.7, 2, -7.24], mats.wood);
  const plantLeaves = [];
  const addPlant = (x, z, size = 1) => {
    const p = group(scene, 'potted plant', [x, 0.12, z]);
    cylinder(p, 'pot', 0.25 * size, 0.3 * size, 0.42 * size, [0, 0.21 * size, 0], mats.terracotta);
    cylinder(p, 'soil', 0.22 * size, 0.22 * size, 0.04 * size, [0, 0.43 * size, 0], mats.darkWood);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 0.4;
      const leaf = sphere(p, 'leaf', 0.22 * size, [Math.cos(angle) * 0.18 * size, (0.68 + (i % 2) * 0.2) * size, Math.sin(angle) * 0.18 * size], i % 2 ? mats.leaf : mats.leafLight, [0.72, 1.45, 0.72]);
      plantLeaves.push({ leaf, phase: plantLeaves.length * 0.9, scale: size });
    }
    cylinder(p, 'stem', 0.035 * size, 0.05 * size, 0.7 * size, [0, 0.72 * size, 0], mats.leaf);
  };
  addPlant(-11.9, -6.45, 1.15);
  addPlant(11.75, -6.35, 1.05);

  // Work desks, computers, task lights and comfy chairs.
  const makeDesk = (x, z, accent, label) => {
    const d = group(scene, label + ' desk', [x, 0, z]);
    box(d, 'desktop', [2.5, 0.16, 1.15], [0, 1.05, 0], mats.woodLight);
    box(d, 'desk front', [2.2, 0.6, 0.12], [0, 0.72, 0.48], mats.wood);
    for (const sx of [-1.03, 1.03]) for (const sz of [-0.4, 0.4]) box(d, 'desk leg', [0.1, 0.9, 0.1], [sx, 0.48, sz], mats.darkWood);
    box(d, 'monitor body', [0.92, 0.66, 0.1], [0, 1.52, -0.29], mats.navy);
    box(d, 'monitor glow', [0.78, 0.5, 0.025], [0, 1.54, -0.225], new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.42, roughness: 0.28 }));
    box(d, 'monitor stand', [0.1, 0.21, 0.1], [0, 1.15, -0.29], mats.metal);
    box(d, 'keyboard', [0.68, 0.04, 0.22], [0, 1.16, 0.1], mats.cream);
    box(d, 'desk mat', [0.94, 0.025, 0.52], [0.02, 1.145, 0.12], mats.sofa);
    cylinder(d, 'mug', 0.075, 0.08, 0.16, [0.87, 1.23, 0.23], mats.cream, 12);
    const chair = group(d, 'chair', [0, 0, 1.04]);
    box(chair, 'seat', [0.76, 0.16, 0.7], [0, 0.68, 0], mats.sofa);
    box(chair, 'back', [0.76, 0.78, 0.15], [0, 1.05, 0.28], mats.sofa);
    cylinder(chair, 'chair post', 0.07, 0.07, 0.58, [0, 0.34, 0], mats.metal);
    for (const sx of [-0.25, 0.25]) box(chair, 'chair foot', [0.1, 0.08, 0.54], [sx, 0.06, 0], mats.metal);
    return d;
  };
  makeDesk(-6.7, -3.35, '#e8ae77', 'Creative');
  makeDesk(-3.5, -3.35, '#8fc3b5', 'Developer');
  makeDesk(-0.25, -3.35, '#b8a5dd', 'Designer');
  makeDesk(3.0, -4.65, '#e6b172', 'Research pod');
  makeDesk(6.05, -4.65, '#83a8d3', 'Design pod');
  makeDesk(9.1, -4.65, '#80b6a4', 'Operations pod');

  // New west wing: enclosed focus studio / library with its own furniture.
  // A broad doorway stays open on the east side so both coworkers and boss can enter.
  const focusStudio = group(scene, 'focus studio wing', [-13.1, 0, -2.4]);
  box(focusStudio, 'focus studio rug', [5.15, 0.06, 5.35], [0, 0.08, 0], material('#c8b69a'));
  box(focusStudio, 'focus studio back wall', [5.45, 2.5, 0.15], [0, 1.25, -2.75], mats.wall);
  box(focusStudio, 'focus studio left wall', [0.15, 2.5, 5.45], [-2.68, 1.25, 0], mats.wall);
  box(focusStudio, 'focus studio east wall upper left', [0.15, 2.5, 1.1], [2.68, 1.25, -2.2], mats.wall);
  box(focusStudio, 'focus studio east wall upper right', [0.15, 2.5, 1.1], [2.68, 1.25, 2.2], mats.wall);
  box(focusStudio, 'focus studio south wall left', [1.25, 2.3, 0.15], [-2.05, 1.15, 2.68], mats.wall);
  box(focusStudio, 'focus studio south wall right', [1.25, 2.3, 0.15], [2.05, 1.15, 2.68], mats.wall);
  box(focusStudio, 'focus studio door lintel', [0.16, 0.18, 3.3], [2.68, 2.44, 0], mats.woodLight);

  // Built-in bookcases, repeated spines and a proper reading / planning table.
  for (const shelfX of [-1.55, 1.55]) {
    box(focusStudio, 'library bookcase frame', [1.05, 1.95, 0.42], [shelfX, 1.02, -2.15], mats.wood);
    for (let row = 0; row < 3; row++) {
      box(focusStudio, 'bookcase shelf', [0.96, 0.07, 0.45], [shelfX, 0.5 + row * 0.58, -1.9], mats.woodLight);
      for (let book = 0; book < 5; book++) {
        const colors = [mats.terracotta, mats.leaf, mats.navy, mats.lamp, mats.fabric];
        box(focusStudio, 'book spine', [0.12, 0.31 + (book % 2) * 0.06, 0.17],
          [shelfX - 0.36 + book * 0.18, 0.69 + row * 0.58, -1.88], colors[(book + row) % colors.length]);
      }
    }
  }
  box(focusStudio, 'focus studio worktable', [1.75, 0.14, 0.9], [-0.8, 0.94, 0.15], mats.woodLight);
  for (const x of [-1.48, -0.12]) for (const z of [-0.15, 0.45]) {
    box(focusStudio, 'focus table leg', [0.08, 0.86, 0.08], [x, 0.43, z], mats.darkWood);
  }
  box(focusStudio, 'open notebook', [0.48, 0.035, 0.34], [-0.9, 1.035, 0.12], mats.cream);
  box(focusStudio, 'notebook page line', [0.3, 0.012, 0.018], [-0.9, 1.06, 0.12], mats.terracotta);
  box(focusStudio, 'table lamp base', [0.22, 0.06, 0.22], [-0.2, 1.06, 0.15], mats.metal);
  cylinder(focusStudio, 'table lamp stem', 0.025, 0.025, 0.28, [-0.2, 1.21, 0.15], mats.metal, 8);
  cylinder(focusStudio, 'table lamp shade', 0.13, 0.2, 0.15, [-0.2, 1.39, 0.15], mats.lamp, 10);
  const focusChair = group(focusStudio, 'focus studio chair', [-0.8, 0, 1.12]);
  box(focusChair, 'focus chair seat', [0.62, 0.14, 0.58], [0, 0.55, 0], mats.sofa);
  box(focusChair, 'focus chair back', [0.62, 0.66, 0.14], [0, 0.91, 0.22], mats.sofa);
  cylinder(focusChair, 'focus chair stem', 0.055, 0.055, 0.45, [0, 0.27, 0], mats.metal, 8);
  addPlant(-10.9, -4.45, 0.6);
  box(scene, 'focus studio sign', [2.15, 0.38, 0.08], [-13.1, 2.68, -5.22], mats.navy);
  box(scene, 'focus studio sign highlight', [1.1, 0.035, 0.035], [-13.1, 2.69, -5.16], mats.lamp);

  // Extra landscaping around the enlarged site edges.
  addPlant(-20.0, -5.8, 1.25);
  addPlant(-20.2, 4.8, 1.1);
  addPlant(22.0, 6.5, 1.2);
  addPlant(22.1, 19.0, 1.15);

  // A shared wall board for sprint notes and a room-wide planning surface.
  box(scene, 'sprint board frame', [4.2, 1.85, 0.16], [6.7, 2.45, -8.0], mats.wood);
  box(scene, 'sprint board', [3.95, 1.6, 0.045], [6.7, 2.45, -7.89], mats.cream);
  for (let i = 0; i < 4; i++) {
    box(scene, 'sprint note', [0.55, 0.32, 0.025], [5.45 + (i % 2) * 0.85, 2.55 + Math.floor(i / 2) * 0.48, -7.85],
      [mats.terracotta, mats.leafLight, mats.lamp, mats.glass][i]);
  }
  box(scene, 'sprint marker rail', [2.5, 0.055, 0.05], [6.7, 1.63, -7.85], mats.metal);

  const warRoom = group(scene, 'war room', [MEET.x, 0, MEET.z]);
  box(warRoom, 'war room rug', [4.8, 0.055, 4.0], [0, 0.11, 0], material('#c9d3bd'));
  cylinder(warRoom, 'conference table top', 1.0, 1.0, 0.16, [0, 0.96, 0], mats.woodLight, 32);
  cylinder(warRoom, 'conference table foot', 0.24, 0.33, 0.84, [0, 0.49, 0], mats.darkWood, 16);
  const meetColors = [mats.sofa, mats.terracotta, mats.navy, mats.leaf];
  MEET_CHAIRS.forEach((c,i)=>{const chair=group(scene,'meeting chair',[c.x,0,c.z]);chair.rotation.y=c.face;box(chair,'chair seat',[0.64,0.15,0.62],[0,0.57,0],meetColors[i]);box(chair,'chair back',[0.64,0.72,0.14],[0,0.97,-0.24],meetColors[i]);cylinder(chair,'chair stem',0.06,0.06,0.48,[0,0.27,0],mats.metal,8);box(chair,'chair base',[0.54,0.06,0.5],[0,0.06,0],mats.metal);});
  box(warRoom,'screen stand',[0.12,1.3,0.12],[0,1.05,-1.82],mats.metal);box(warRoom,'team screen frame',[2,1.25,0.12],[0,1.8,-1.82],mats.navy);box(warRoom,'team screen',[1.78,1.02,0.035],[0,1.82,-1.74],material('#9ed1c0',0.25,{emissive:'#5b9f8e',emissiveIntensity:0.38}));
  const meeting=group(scene,'reading corner',[NOOK.x,0,NOOK.z]);cylinder(meeting,'round tabletop',0.75,0.75,0.16,[0,0.95,0],mats.woodLight,24);cylinder(meeting,'table leg',0.13,0.25,0.88,[0,0.47,0],mats.wood);
  NOOK_POUFS.forEach((p,i)=>cylinder(scene,'pouf',0.42,0.43,0.48,[p.x,0.25,p.z],[mats.terracotta,mats.sofa,mats.fabric][i],12));cylinder(meeting,'plant pot',0.22,0.28,0.28,[0.2,1.17,-0.05],mats.terracotta);sphere(meeting,'small plant',0.26,[0.2,1.48,-0.05],mats.leafLight,[1,1.35,1]);

  // The old loose pouf/table cluster was removed from the circulation spine.
  // The lounge and conference room are the dedicated social zones now.

  // Cozy lounge: sofa, cushions, coffee table, rug, books and standing lamp.
  const lounge = group(scene, 'lounge', [5.9, 0, -1.0]);
  box(lounge, 'rug', [5.3, 0.055, 4.2], [0, 0.12, 0.4], material('#d8bfa3'));
  box(lounge, 'sofa base', [3.5, 0.55, 1.16], [0, 0.5, -0.45], mats.sofa);
  box(lounge, 'sofa back', [3.5, 1.05, 0.28], [0, 0.98, -0.95], mats.sofa);
  box(lounge, 'sofa arm', [0.3, 0.75, 1.15], [-1.58, 0.66, -0.42], mats.sofa);
  box(lounge, 'sofa arm', [0.3, 0.75, 1.15], [1.58, 0.66, -0.42], mats.sofa);
  box(lounge, 'cushion', [0.82, 0.16, 0.6], [-0.88, 0.83, -0.44], mats.fabric);
  box(lounge, 'cushion', [0.82, 0.16, 0.6], [0.05, 0.83, -0.44], mats.terracotta);
  box(lounge, 'cushion', [0.82, 0.16, 0.6], [0.92, 0.83, -0.44], mats.cream);
  box(lounge, 'coffee table', [2, 0.16, 0.94], [0, 0.55, 1.7], mats.woodLight);
  for (const x of [-0.78, 0.78]) for (const z of [1.39, 2.01]) box(lounge, 'coffee table leg', [0.08, 0.44, 0.08], [x, 0.3, z], mats.darkWood);
  box(lounge, 'book one', [0.6, 0.07, 0.38], [-0.43, 0.67, 1.69], material('#d68d65'));
  box(lounge, 'book two', [0.55, 0.07, 0.35], [-0.39, 0.75, 1.67], material('#7e9a81'));
  const lamp = group(lounge, 'floor lamp', [2.1, 0, -0.5]);
  cylinder(lamp, 'lamp base', 0.3, 0.3, 0.1, [0, 0.18, 0], mats.metal);
  cylinder(lamp, 'lamp pole', 0.045, 0.045, 2.1, [0, 1.23, 0], mats.metal);
  cylinder(lamp, 'lamp shade', 0.28, 0.43, 0.42, [0, 2.38, 0], mats.lamp, 12);

  // Gaming nook with arcade cabinet and a tiny console screen.
  const game = group(scene, 'game room', [6.2, 0, 2.7]);
  box(game, 'game rug', [4.8, 0.055, 3.1], [0, 0.12, 0], material('#c6b5a1'));
  for (let i = 0; i < 2; i++) {
    const x = -1.15 + i * 1.7;
    box(game, 'arcade base', [0.85, 1.45, 0.62], [x, 0.9, -0.95], i ? mats.terracotta : mats.navy);
    box(game, 'arcade screen frame', [0.6, 0.48, 0.07], [x, 1.25, -0.59], mats.darkWood);
    box(game, 'arcade screen', [0.49, 0.36, 0.025], [x, 1.26, -0.545], material(i ? '#e5ad75' : '#90c2ae', 0.3, { emissive: i ? '#d77d42' : '#4c9882', emissiveIntensity: 0.45 }));
    sphere(game, 'arcade button', 0.06, [x + 0.15, 0.96, -0.54], mats.lamp, [1, 0.4, 1]);
  }
  box(game, 'console screen', [1.35, 0.82, 0.12], [0, 1.14, 1.08], mats.navy);
  box(game, 'console display', [1.13, 0.62, 0.035], [0, 1.15, 1.005], material('#9fc9ad', 0.25, { emissive: '#6d9b8c', emissiveIntensity: 0.35 }));
  box(game, 'console shelf', [1.8, 0.16, 0.5], [0, 0.55, 1.08], mats.woodLight);
  for (let i = 0; i < 2; i++) {
    // Keep the beanbags in the two back corners so the middle walking lane
    // stays open between the arcade cabinets and the console.
    sphere(game, 'bean bag', 0.48, [i ? 1.7 : -2.05, 0.38, 0.7], i ? mats.terracotta : mats.sofa, [1.0, 0.68, 1.0]);
  }

  // Pantry with fridge, counter, coffee machine and tiny galon.
  const pantry = group(scene, 'pantry', [-6.2, 0, 2.5]);
  box(pantry, 'counter', [3.8, 0.88, 1.15], [0, 0.59, -0.2], mats.woodLight);
  box(pantry, 'counter top', [4, 0.12, 1.28], [0, 1.07, -0.2], mats.cream);
  box(pantry, 'cabinet', [0.82, 1.9, 0.8], [-1.2, 1.08, -1.15], mats.white);
  box(pantry, 'fridge door', [0.66, 1.55, 0.1], [-1.2, 1.17, -0.71], material('#c4d0ca'));
  box(pantry, 'fridge handle', [0.04, 0.55, 0.06], [-0.93, 1.2, -0.63], mats.metal);
  box(pantry, 'coffee machine', [0.62, 0.72, 0.5], [0.25, 1.45, -0.18], mats.navy);
  box(pantry, 'coffee machine panel', [0.37, 0.3, 0.045], [0.25, 1.51, 0.08], mats.lamp);
  cylinder(pantry, 'mug', 0.1, 0.11, 0.16, [0.65, 1.23, -0.05], mats.terracotta, 12);
  cylinder(pantry, 'water jug', 0.22, 0.24, 0.58, [1.25, 1.39, -0.2], material('#a9ced0', 0.25, { transparent: true, opacity: 0.78 }), 12);
  cylinder(pantry, 'galon stand', 0.26, 0.26, 0.55, [1.25, 0.62, -0.2], mats.white, 12);
  box(pantry, 'galon tap', [0.16, 0.08, 0.17], [1.25, 0.79, 0.07], mats.navy);

  box(scene,'bathroom tile',[3,0.03,3.3],[-11.4,0.105,5.95],material('#dfe9e6',0.5));
  const bath=group(scene,'bathroom',[0,0,0]);box(bath,'toilet tank',[0.5,0.55,0.18],[-12.2,0.4,4.55],mats.white);cylinder(bath,'toilet bowl',0.24,0.2,0.4,[-12.2,0.3,4.95],mats.white,14);cylinder(bath,'toilet seat',0.28,0.32,0.055,[-12.2,0.49,4.95],mats.metal,20);
  box(bath,'shower tray',[1.4,0.05,1],[-10.7,0.12,4.85],mats.cream);box(bath,'shower glass',[1.4,1.9,0.04],[-10.7,1,5.33],mats.glass,{castShadow:false});cylinder(bath,'shower pipe',0.03,0.03,1.9,[-11.3,1.05,4.45],mats.metal,6);cylinder(bath,'shower head',0.15,0.15,0.04,[-11.3,2,4.65],mats.metal,12);
  box(bath,'sink counter',[0.55,0.85,1.2],[-12.55,0.52,6.7],mats.woodLight);box(bath,'sink basin',[0.4,0.06,0.5],[-12.5,0.97,6.7],mats.white);cylinder(bath,'faucet',0.02,0.02,0.2,[-12.4,1.08,6.7],mats.metal,6);box(bath,'mirror',[0.04,0.9,0.8],[-12.95,1.7,6.7],material('#cfe3e6',0.1,{metalness:0.3}));
  box(scene,'dining rug',[4.4,0.03,3.1],[-7.2,0.105,6],material('#d6c4a6'));const dining=group(scene,'dining',[DINE.x,0,DINE.z]);box(dining,'dining top',[0.9,0.08,2.2],[0,0.8,0],mats.woodLight);
  for(const sx of [-0.38,0.38])for(const sz of [-0.98,0.98])box(dining,'dining leg',[0.07,0.76,0.07],[sx,0.4,sz],mats.darkWood);for(const z of [-0.6,0,0.6])cylinder(dining,'plate',0.14,0.14,0.02,[0,0.85,z],mats.cream,14);cylinder(dining,'vase',0.07,0.09,0.22,[0,0.95,0.2],mats.terracotta,10);
  DINE_CHAIRS.forEach(c=>{const chair=group(scene,'dining chair',[c.x,0,c.z]);chair.rotation.y=c.face;box(chair,'seat',[0.5,0.08,0.5],[0,0.5,0],mats.fabric);box(chair,'back',[0.5,0.55,0.07],[0,0.8,-0.22],mats.fabric);for(const sx of [-0.2,0.2])for(const sz of [-0.2,0.2])box(chair,'leg',[0.05,0.46,0.05],[sx,0.23,sz],mats.darkWood);});
  const poolRipples=[];box(scene,'pool deck',[4.15,0.03,4],[10.93,0.105,5.58],material('#d3dccf',0.7));const pool=group(scene,'pool',[POOL.x,0,POOL.z]);const rimY=GROUND+0.225,hw=POOL.iw/2+0.1,hd=POOL.id/2+0.1;
  box(pool,'pool rim north',[POOL.iw+0.4,0.45,0.2],[0,rimY,-hd],mats.cream);box(pool,'pool rim south',[POOL.iw+0.4,0.45,0.2],[0,rimY,hd],mats.cream);box(pool,'pool rim west',[0.2,0.45,POOL.id],[-hw,rimY,0],mats.cream);box(pool,'pool rim east',[0.2,0.45,POOL.id],[hw,rimY,0],mats.cream);box(pool,'pool floor',[POOL.iw,0.02,POOL.id],[0,0.1,0],material('#8fd0d8'),{castShadow:false});box(pool,'pool water',[POOL.iw,0.3,POOL.id],[0,0.24,0],waterMat,{castShadow:false});
  for(const x of [-0.25,0.25])cylinder(pool,'pool ladder rail',0.02,0.02,0.75,[x,0.6,-hd],mats.metal,6);
  for(let i=0;i<4;i++){const ripple=new THREE.Mesh(new THREE.TorusGeometry(0.18+i*0.07,0.012,4,24),material('#b9e5df',0.25,{transparent:true,opacity:0.65}));ripple.rotation.x=-Math.PI/2;ripple.position.set(-0.85+i*0.55,0.45,-0.3+(i%2)*0.55);pool.add(ripple);poolRipples.push({ripple,phase:i*1.45});}

  // An actual translucent divider separates the lounge from the game nook.
  // The center opening stays wide enough for walking routes.
  const loungeGameDivider = group(scene, 'lounge and game room divider');
  for (const [x, width] of [[3.95, 1.4], [8.0, 1.4]]) {
    box(loungeGameDivider, 'divider wood lower panel', [width, 1.3, 0.14], [x, 0.76, 1.04], mats.wood);
    box(loungeGameDivider, 'divider glass upper panel', [width, 0.82, 0.055], [x, 1.86, 1.04], mats.glass);
    box(loungeGameDivider, 'divider cap rail', [width + 0.06, 0.07, 0.18], [x, 2.3, 1.04], mats.woodLight);
  }

  // Low glass partitions divide the studio into quieter work pods while keeping sightlines.
  const workDividers = [
    [-5.0, -3.0], [-1.82, -3.0], [1.42, -5.35], [4.56, -5.35], [7.68, -5.35]
  ];
  workDividers.forEach(([x, z], i) => {
    box(scene, 'work pod divider base', [0.11, 0.64, 1.82], [x, 0.36, z], mats.woodLight);
    box(scene, 'work pod divider glass', [0.045, 0.82, 1.82], [x, 1.09, z], mats.glass);
  });

  // Glass-and-wood partitions frame the executive room without closing it off.
  const bossPartitions = group(scene, 'boss office partitions', [-1.65, 0, 3.75]);
  box(bossPartitions, 'boss rear left partition', [2.05, 1.85, 0.13], [-1.58, 1.0, -2.05], mats.wood);
  box(bossPartitions, 'boss rear left glass', [2.05, 0.95, 0.045], [-1.58, 2.38, -2.05], mats.glass);
  box(bossPartitions, 'boss rear right partition', [1.78, 1.85, 0.13], [1.71, 1.0, -2.05], mats.wood);
  box(bossPartitions, 'boss rear right glass', [1.78, 0.95, 0.045], [1.71, 2.38, -2.05], mats.glass);
  box(bossPartitions, 'boss side left partition', [0.13, 1.85, 3.85], [-2.62, 1.0, -0.04], mats.wood);
  box(bossPartitions, 'boss side left glass', [0.045, 0.95, 3.0], [-2.62, 2.38, -0.04], mats.glass);
  box(bossPartitions, 'boss side right rear partition', [0.13, 1.85, 1.05], [2.62, 1.0, -1.35], mats.wood);
  box(bossPartitions, 'boss side right rear glass', [0.045, 0.95, 1.05], [2.62, 2.38, -1.35], mats.glass);
  box(bossPartitions, 'boss side right front partition', [0.13, 1.85, 1.35], [2.62, 1.0, 1.2], mats.wood);
  box(bossPartitions, 'boss side right front glass', [0.045, 0.95, 1.35], [2.62, 2.38, 1.2], mats.glass);

  // A dedicated founder zone: warm rug, executive desk, laptop, guest chairs,
  // and a custom 3D Riiddev avatar based on the supplied character reference.
  const bossZone = group(scene, 'boss office', [-1.65, 0, 3.75]);
  box(bossZone, 'boss area rug', [5.2, 0.055, 3.7], [0, 0.11, -0.25], material('#d8c3a8'));
  box(bossZone, 'executive desk top', [3.65, 0.17, 1.05], [0, 1.05, -1.25], mats.woodLight);
  box(bossZone, 'executive desk front', [3.25, 0.66, 0.13], [0, 0.68, -0.73], mats.wood);
  for (const x of [-1.48, 1.48]) for (const z of [-1.58, -0.96]) box(bossZone, 'executive desk leg', [0.11, 0.88, 0.11], [x, 0.46, z], mats.darkWood);
  box(bossZone, 'executive monitor frame', [1.15, 0.72, 0.1], [0, 1.55, -1.55], mats.navy);
  box(bossZone, 'executive monitor glow', [0.98, 0.55, 0.03], [0, 1.56, -1.49], material('#a4d4be', 0.24, { emissive: '#75b59b', emissiveIntensity: 0.5 }));
  box(bossZone, 'executive monitor stand', [0.12, 0.2, 0.12], [0, 1.17, -1.54], mats.metal);
  box(bossZone, 'boss keyboard', [0.72, 0.04, 0.23], [0, 1.16, -0.95], mats.cream);
  box(bossZone, 'boss desk mat', [1.05, 0.025, 0.55], [0, 1.145, -0.92], mats.navy);
  cylinder(bossZone, 'boss coffee mug', 0.09, 0.1, 0.16, [1.15, 1.22, -0.95], mats.terracotta, 12);
  box(bossZone, 'nameplate', [1.35, 0.25, 0.07], [0, 0.82, -0.65], mats.navy);
  box(bossZone, 'nameplate gold accent', [0.92, 0.035, 0.025], [0, 0.86, -0.605], mats.lamp);
  for (const x of [-2.1, 2.1]) {
    const guest = group(bossZone, 'guest chair', [x, 0, -0.02]);
    guest.rotation.y = Math.PI;
    box(guest, 'guest chair seat', [0.72, 0.15, 0.67], [0, 0.48, 0], mats.sofa);
    box(guest, 'guest chair back', [0.72, 0.82, 0.15], [0, 0.9, -0.24], mats.sofa);
    cylinder(guest, 'guest chair leg', 0.07, 0.07, 0.44, [0, 0.22, 0], mats.metal, 8);
  }
  const bossChair = group(scene, 'boss chair', [-1.65, 0, 3.85]);
  box(bossChair, 'seat', [0.76, 0.16, 0.7], [0, 0.68, 0], mats.navy);
  box(bossChair, 'back', [0.76, 0.78, 0.15], [0, 1.05, 0.3], mats.navy);
  cylinder(bossChair, 'post', 0.07, 0.07, 0.58, [0, 0.34, 0], mats.metal);
  box(bossChair, 'foot', [0.6, 0.08, 0.54], [0, 0.06, 0], mats.metal);

  // 3D avatar inspired by the reference: black hair, warm skin, navy jacket,
  // cream trousers, monochrome sneakers, and white wired earbuds.
  const bossRoot = group(scene, 'riiddev-founder-avatar', [-1.65, 0, 4.45]);
  bossRoot.userData.character = agents.find((agent) => agent.id === 'boss');
  const bossSkin = material('#ca8b79');
  const bossHair = material('#241f20', 0.92);
  const bossJacket = material('#292c51', 0.72);
  const bossShirt = material('#fffdf7', 0.9);
  const bossPants = material('#f0dfbd', 0.92);
  const bossShoes = material('#1f2224', 0.7);
  const bossSole = material('#fffdf9', 0.85);
  const earbudMat = material('#fffdf9', 0.35);
  const faceInk = material('#261e1d', 0.9);
  const cableMat = material('#fffdf9', 0.38);
  const goldMat = material('#d9b46e', 0.42, { metalness: 0.25 });
  sphere(bossRoot, 'boss pants waist', 0.28, [0, 0.61, 0], bossPants, [1.25, 0.48, 0.9]);
  const bossLegs = [];
  for (const side of [-1, 1]) {
    const leg = group(bossRoot, side < 0 ? 'boss left walking leg' : 'boss right walking leg', [side * 0.155, 0.52, 0]);
    sphere(leg, 'cream trouser', 0.22, [0, -0.18, 0], bossPants, [0.72, 1.38, 0.78]);
    sphere(leg, 'sneaker sole', 0.15, [0, -0.465, 0.115], bossSole, [1.0, 0.34, 1.55]);
    sphere(leg, 'black sneaker', 0.15, [0, -0.41, 0.105], bossShoes, [1.0, 0.58, 1.45]);
    sphere(leg, 'white sneaker toe', 0.1, [0, -0.405, 0.255], bossSole, [1.0, 0.78, 0.9]);
    for (let lace = 0; lace < 2; lace++) box(leg, 'sneaker lace', [0.09, 0.012, 0.018], [0, -0.36 + lace * 0.025, 0.17 + lace * 0.055], bossSole);
    bossLegs.push(leg);
  }
  sphere(bossRoot, 'white tee', 0.37, [0, 0.96, 0.005], bossShirt, [0.83, 1.13, 0.74]);
  sphere(bossRoot, 'navy jacket body', 0.39, [0, 0.98, -0.005], bossJacket, [1.05, 1.08, 0.72]);
  box(bossRoot, 'white shirt panel', [0.23, 0.58, 0.035], [0, 0.96, 0.276], bossShirt);
  box(bossRoot, 'left jacket front', [0.16, 0.62, 0.05], [-0.185, 0.96, 0.265], bossJacket, { rotation: [0, 0, -0.08] });
  box(bossRoot, 'right jacket front', [0.16, 0.62, 0.05], [0.185, 0.96, 0.265], bossJacket, { rotation: [0, 0, 0.08] });
  box(bossRoot, 'jacket zipper', [0.018, 0.48, 0.018], [0, 0.92, 0.305], goldMat);
  const bossArms = [];
  for (const side of [-1, 1]) {
    const arm = group(bossRoot, side < 0 ? 'boss left animated arm' : 'boss right animated arm', [side * 0.35, 1.12, 0.02]);
    sphere(arm, 'jacket shoulder', 0.18, [side * 0.02, 0.05, -0.025], bossJacket, [0.95, 0.92, 0.95]);
    sphere(arm, 'jacket sleeve', 0.16, [side * 0.055, -0.21, 0.015], bossJacket, [0.78, 1.5, 0.78]);
    sphere(arm, 'jacket cuff', 0.11, [-side * 0.03, -0.44, 0.12], bossJacket, [0.9, 0.72, 0.85]);
    sphere(arm, 'boss hand', 0.105, [-side * 0.095, -0.53, 0.185], bossSkin, [0.92, 1.0, 0.8]);
    bossArms.push({ group: arm, side });
  }
  const bossHead = group(bossRoot, 'boss animated head', [0, 0, 0]);
  sphere(bossHead, 'hair silhouette', 0.38, [0, 1.78, -0.02], bossHair, [1.04, 0.94, 0.94]);
  sphere(bossHead, 'face', 0.37, [0, 1.51, 0.075], bossSkin, [0.98, 1.1, 0.87]);
  sphere(bossHead, 'left side hair', 0.15, [-0.32, 1.58, 0.03], bossHair, [0.72, 1.36, 0.98]);
  sphere(bossHead, 'right side hair', 0.15, [0.32, 1.58, 0.03], bossHair, [0.72, 1.36, 0.98]);
  sphere(bossHead, 'front fringe', 0.22, [0, 1.81, 0.2], bossHair, [1.45, 0.48, 0.58]);
  sphere(bossHead, 'left fringe', 0.12, [-0.21, 1.73, 0.24], bossHair, [0.84, 0.7, 0.65]);
  sphere(bossHead, 'right fringe', 0.12, [0.21, 1.73, 0.24], bossHair, [0.84, 0.7, 0.65]);
  for (const x of [-0.36, 0.36]) {
    sphere(bossHead, 'ear', 0.09, [x, 1.52, 0.07], bossSkin, [0.7, 1.1, 0.7]);
    sphere(bossHead, 'white earbud', 0.07, [x * 1.01, 1.54, 0.155], earbudMat, [0.7, 1.25, 0.7]);
    sphere(bossHead, 'earbud stem', 0.025, [x * 1.01, 1.46, 0.18], earbudMat, [0.8, 1.4, 0.8]);
  }
  for (const x of [-0.125, 0.125]) {
    sphere(bossHead, 'eye', 0.034, [x, 1.54, 0.389], faceInk, [1, 1.08, 0.58]);
    sphere(bossHead, 'eye highlight', 0.011, [x - 0.008, 1.553, 0.408], bossSole, [1, 1, 0.6]);
  }
  box(bossHead, 'left eyebrow', [0.17, 0.035, 0.035], [-0.13, 1.655, 0.37], faceInk, { rotation: [0, 0, 0.08] });
  box(bossHead, 'right eyebrow', [0.17, 0.035, 0.035], [0.13, 1.655, 0.37], faceInk, { rotation: [0, 0, -0.08] });
  sphere(bossHead, 'nose', 0.043, [0, 1.465, 0.416], bossSkin, [0.82, 0.9, 0.8]);
  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.13, 1.385, 0.374), new THREE.Vector3(-0.07, 1.355, 0.395),
    new THREE.Vector3(0, 1.35, 0.4), new THREE.Vector3(0.07, 1.355, 0.395),
    new THREE.Vector3(0.13, 1.385, 0.374)
  ]);
  const smile = new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 14, 0.012, 5, false), faceInk);
  smile.name = 'friendly smile';
  bossHead.add(smile);
  const cableLeft = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.36, 1.46, 0.19), new THREE.Vector3(-0.39, 1.22, 0.19),
    new THREE.Vector3(-0.31, 1.02, 0.26), new THREE.Vector3(-0.15, 0.91, 0.3),
    new THREE.Vector3(0.03, 0.79, 0.31), new THREE.Vector3(0.04, 0.63, 0.27)
  ]);
  const cableRight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.36, 1.46, 0.19), new THREE.Vector3(0.4, 1.22, 0.19),
    new THREE.Vector3(0.34, 1.0, 0.26), new THREE.Vector3(0.19, 0.9, 0.3),
    new THREE.Vector3(0.03, 0.79, 0.31), new THREE.Vector3(0.04, 0.63, 0.27)
  ]);
  for (const [name, curve] of [['left earbud cable', cableLeft], ['right earbud cable', cableRight]]) {
    const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 5, false), cableMat);
    cable.name = name;
    cable.castShadow = false;
    bossRoot.add(cable);
  }
  cylinder(bossRoot, 'boss title halo', 0.22, 0.22, 0.045, [0, 2.15, 0], goldMat, 16);
  for (let spike = 0; spike < 3; spike++) {
    const tip = cylinder(bossRoot, 'boss crown detail', 0.025, 0.07, 0.12, [(spike - 1) * 0.12, 2.23, 0], goldMat, 6);
    tip.rotation.z = (spike - 1) * -0.18;
  }

  // Desk-side bookcase and colorful books.
  const shelf = group(scene, 'bookcase', [-8.6, 0, -1.6]);
  box(shelf, 'bookcase body', [0.72, 2.25, 2.2], [0, 1.2, 0], mats.wood);
  for (let y = 0.55; y < 2.15; y += 0.55) box(shelf, 'shelf plank', [0.8, 0.09, 2.18], [0, y, 0], mats.woodLight);
  const bookColors = ['#d98d6b', '#e1c77e', '#8eaf91', '#89a8bd', '#c89ac2', '#f0e4d1'];
  for (let i = 0; i < 15; i++) box(shelf, 'book', [0.35 + (i % 3) * 0.04, 0.36, 0.09], [-0.02, 0.34 + Math.floor(i / 5) * 0.55, -0.8 + (i % 5) * 0.38], material(bookColors[i % bookColors.length]), { rotation: [0, 0, (i % 2 ? 0.08 : -0.04)] });

  // Ceiling pendant lights, hanging above the work and lounge zones.
  for (const x of [-6, -2.5, 2, 6.2]) {
    cylinder(scene, 'pendant cable', 0.025, 0.025, 0.56, [x, 3.76, -1.1], mats.metal, 6);
    cylinder(scene, 'pendant shade', 0.27, 0.42, 0.23, [x, 3.42, -1.1], mats.lamp, 12);
    const light = new THREE.PointLight('#ffe3b2', 0.32, 7);
    light.position.set(x, 3.2, -1.1);
    scene.add(light);
  }

  const FLOOR_Y=0.09,frost=new THREE.MeshStandardMaterial({color:'#dcebe6',roughness:0.4,transparent:true,opacity:0.62});
  WALLS.forEach(w=>{const tall=w.h>1.6,gm=w.style==='frost'?frost:mats.glass;wallSegments(w).forEach(s=>{const alongX=s.sx>s.sz,baseH=tall?w.h:0.55;box(scene,'sekat base',[s.sx,baseH,s.sz],[s.x,FLOOR_Y+baseH/2,s.z],tall?mats.wall:mats.woodLight);if(!tall){const gh=w.h-0.55;box(scene,'sekat glass',[alongX?s.sx:0.04,gh,alongX?0.04:s.sz],[s.x,FLOOR_Y+0.55+gh/2,s.z],gm,{castShadow:false});}box(scene,'sekat rail',[alongX?s.sx+0.1:0.12,0.07,alongX?0.12:s.sz+0.1],[s.x,FLOOR_Y+w.h+0.03,s.z],mats.wood);for(const e of [-1,1])box(scene,'sekat post',[0.12,w.h,0.12],[alongX?s.x+e*s.sx/2:s.x,FLOOR_Y+w.h/2,alongX?s.z:s.z+e*s.sz/2],mats.wood);});});
  const characterGroups=[],actors=[];
  characters.forEach((info,i)=>{
    const c=group(scene,'character-'+info.id,[0,GROUND,0]);c.userData.character=info;c.userData.phase=i*1.8;
    const skin=material(info.color),shirt=material(info.shirt),hair=material(info.hair),face=material('#4b3b33'),head=group(c,'head pivot',[0,1.1,0]);
    sphere(head,'head',0.27,[0,0.15,0],skin,[0.88,1.02,0.88]);sphere(head,'hair',0.275,[0,0.29,-0.035],hair,[0.9,0.55,0.9]);sphere(head,'eye-left',0.025,[-0.085,0.17,0.232],face,[1,1,0.5]);sphere(head,'eye-right',0.025,[0.085,0.17,0.232],face,[1,1,0.5]);sphere(c,'body',0.28,[0,0.77,0],shirt,[0.83,1.08,0.62]);
    const arms=[-1,1].map(side=>{const arm=group(c,'arm',[side*0.29,0.95,0]);sphere(arm,'sleeve',0.105,[0,-0.07,0],shirt,[0.9,1.2,0.9]);sphere(arm,'arm',0.095,[0,-0.2,0],skin,[0.82,1.7,0.82]);sphere(arm,'hand',0.08,[0,-0.36,0.02],skin);return arm;});
    const legs=[-1,1].map(side=>{const leg=group(c,'leg',[side*0.12,0.52,0]);cylinder(leg,'leg',0.085,0.095,0.4,[0,-0.19,0],mats.navy,8);sphere(leg,'shoe',0.12,[0,-0.4,0.04],mats.cream,[1,0.58,1.35]);return leg;});
    const color=info.status==='working'?'#79b88a':info.status==='review'?'#e0b46b':info.status==='blocked'?'#d78370':'#96a3b0',stateMaterial=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0.58,roughness:0.35});
    c.userData.statusOrb=sphere(c,'status-orb',0.075,[0,1.78,0],stateMaterial);const ring=new THREE.Mesh(new THREE.TorusGeometry(0.11,0.018,6,14),stateMaterial);ring.name='status-ring';ring.position.set(0,1.78,0);ring.rotation.x=Math.PI/2;c.add(ring);c.userData.statusRing=ring;
    characterGroups.push(c);actors.push(makeActor(c,{legs,arms,head},{home:i<6?i:null,speed:0.95+(i%3)*0.12,phase:i*1.8}));
  });
  const bossActor=makeActor(bossRoot,{legs:bossLegs,arms:bossArms.map(o=>o.group),head:bossHead,headTilt:false},{boss:true,speed:1.1,phase:1.4});actors.push(bossActor);
  const deskSt=stations.filter(s=>s.tag==='desk'),meetSt=stations.filter(s=>s.tag==='meet');
  actors.forEach((a,i)=>{seatAt(a,a.boss?stations.find(s=>s.tag==='boss'):i<6?deskSt[i]:meetSt[(i-6)%meetSt.length]);applyPose(a,1,0);});
  const originalCamera = new THREE.Vector3(34, 26, 40);
  const resize = () => {
    const width = Math.max(host.clientWidth, 320);
    const height = Math.max(host.clientHeight, 320);
    camera.aspect = width / height;
    // Keep the full dollhouse in view on narrow portrait screens.
    camera.fov = width < 620 ? 47 : width < 920 ? 42 : 38;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  let isNight = false;
  const setNight = (night) => {
    isNight = Boolean(night);
    const sky = isNight ? '#292e3f' : '#d8d9cc';
    const fog = isNight ? '#292e3f' : '#d8d9cc';
    gsap.to(scene.background, { r: new THREE.Color(sky).r, g: new THREE.Color(sky).g, b: new THREE.Color(sky).b, duration: 0.65 });
    if (scene.fog) {
      scene.fog.color.set(fog);
    }
    gsap.to(sun, { intensity: isNight ? 0.42 : 1.85, duration: 0.7 });
    gsap.to(warmFill, { intensity: isNight ? 0.75 : 0.2, duration: 0.7 });
    renderer.toneMappingExposure = isNight ? 0.7 : 0.82;
    mats.lamp.emissiveIntensity = isNight ? 1.25 : 0.45;
    mats.lamp.color.set(isNight ? '#fff0bb' : '#ffdf99');
  };

  const roomViews = {
    all: { position: [34, 26, 40], target: [0, 1.0, 4.7] },
    focus: { position: [-4.8, 8.5, 13.5], target: [-13.1, 1.1, -2.4] },
    boss: { position: [10.5, 8.5, 13], target: [-1.65, 1.05, 3.3] },
    studio: { position: [12, 10, 16], target: [0.2, 1, -3.0] },
    meeting: { position: [11, 8.5, 12], target: [10.6, 1, 0.1] },
    lounge: { position: [14, 10, 10], target: [5.7, 1, -1.6] },
    games: { position: [13, 9, 12], target: [6.2, 0.8, 2.0] },
    pantry: { position: [9, 9, 14], target: [-6.4, 1, 1.9] },
    bathroom: { position: [-5, 8, 15], target: [-11.4, 0.8, 5.9] },
    dining: { position: [-2, 9, 17], target: [-7.2, 0.8, 5.8] },
    pool: { position: [19, 9, 15], target: [11.3, 0.3, 5.6] }
  };
  const focusRoom = (room) => {
    const view = roomViews[room] || roomViews.all;
    gsap.to(camera.position, { x: view.position[0], y: view.position[1], z: view.position[2], duration: 1.1, ease: 'power3.inOut', onUpdate: () => controls.update() });
    gsap.to(controls.target, { x: view.target[0], y: view.target[1], z: view.target[2], duration: 1.1, ease: 'power3.inOut' });
  };
  const resetView = () => focusRoom('all');

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = null;
  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    pointerDown = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event) => {
    if (!pointerDown) return;
    const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    pointerDown = null;
    if (distance > 6) return;
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...characterGroups, bossRoot], true);
    if (!hits.length) return;
    let parent = hits[0].object;
    while (parent && !parent.userData.character) parent = parent.parent;
    if (parent?.userData.character && typeof onSelect === 'function') {
      onSelect(parent.userData.character.id);
    }
  };
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.style.cursor = 'grab';

  let animationFrame = 0;
  const clock = new THREE.Clock();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = () => {
    animationFrame = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.04), elapsed = clock.elapsedTime;
    if (!reducedMotion) {
      actors.forEach(actor => updateActor(actor,delta,elapsed)); separate(actors,delta);
      plantLeaves.forEach(({leaf,phase})=>{leaf.rotation.z=Math.sin(elapsed*0.55+phase)*0.045;leaf.rotation.x=Math.cos(elapsed*0.42+phase)*0.025;});
      poolRipples.forEach(({ripple,phase})=>{const wave=(elapsed*0.42+phase)%1,scale=0.72+wave*0.48;ripple.scale.set(scale,scale,scale);ripple.material.opacity=0.16+(1-wave)*0.38;});
    }
    characterGroups.forEach(character=>{const phase=character.userData.phase||0;if(character.userData.statusOrb&&character.userData.statusRing){character.userData.statusOrb.scale.setScalar(1+Math.sin(elapsed*2.7+phase)*0.08);character.userData.statusRing.rotation.z+=delta*0.2;}});
    controls.update();renderer.render(scene,camera);
  };
  animate();

  return {
    setNight,
    focusRoom,
    resetView,
    destroy() {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
          else if (object.material) object.material.dispose();
        }
      });
    }
  };
}