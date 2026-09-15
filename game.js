const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const scoreEl=document.getElementById("score"), livesEl=document.getElementById("lives"), timeEl=document.getElementById("time");
const startScreen=document.getElementById("startScreen"), gameOver=document.getElementById("gameOver"), finalScore=document.getElementById("finalScore"), bestLine=document.getElementById("bestLine");
let W=0,H=0,dpr=1,ground=0,last=0,running=false,score=0,lives=3,timeLeft=60,best=Number(localStorage.getItem("coinDashBest")||0);
const keys={left:false,right:false,jump:false};
const player={x:150,y:0,w:46,h:62,vx:0,vy:0,onGround:false,inv:0,boost:0};
let objects=[],particles=[],spawnClock=0,coinClock=0,scroll=0;

function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ground=H*.79;if(!running) player.y=ground-player.h}
addEventListener("resize",resize);resize();

function reset(){score=0;lives=3;timeLeft=60;objects=[];particles=[];spawnClock=.4;coinClock=.2;scroll=0;player.x=W*.16;player.y=ground-player.h;player.vx=player.vy=0;player.inv=0;player.boost=0;updateHud()}
function start(){reset();running=true;startScreen.classList.add("hidden");gameOver.classList.add("hidden");last=performance.now();requestAnimationFrame(loop)}
function end(){running=false;finalScore.textContent=score;best=Math.max(best,score);localStorage.setItem("coinDashBest",best);bestLine.textContent=`Best score: ${best}`;gameOver.classList.remove("hidden")}
document.getElementById("startBtn").onclick=start;document.getElementById("restartBtn").onclick=start;

addEventListener("keydown",e=>{if(["ArrowLeft","a","A"].includes(e.key))keys.left=true;if(["ArrowRight","d","D"].includes(e.key))keys.right=true;if(["ArrowUp","w","W"," "].includes(e.key)){keys.jump=true;e.preventDefault()}});
addEventListener("keyup",e=>{if(["ArrowLeft","a","A"].includes(e.key))keys.left=false;if(["ArrowRight","d","D"].includes(e.key))keys.right=false;if(["ArrowUp","w","W"," "].includes(e.key))keys.jump=false});
document.querySelectorAll(".mobile-controls button").forEach(b=>{const k=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();keys[k]=true});["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false))});

function updateHud(){scoreEl.textContent=score;livesEl.textContent=lives;timeEl.textContent=Math.ceil(timeLeft)}
function addParticle(x,y,color,size=5){particles.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.8)*180,life:.5,max:.5,color,size})}
function spawn(type,x=W+80,y=ground){objects.push({type,x,y,phase:Math.random()*6.28})}
function spawnRandom(){
 const r=Math.random();
 if(r<.43){spawn("coin",W+60,ground-80-Math.random()*120)}
 else if(r<.55){spawn("bonus",W+60,ground-150-Math.random()*100)}
 else if(r<.65){spawn("gem",W+60,ground-80-Math.random()*160)}
 else if(r<.72){spawn("boost",W+60,ground-110-Math.random()*100)}
 else if(r<.87){spawn("slime",W+60,ground-42)}
 else if(r<.96){spawn("bat",W+60,ground-170-Math.random()*100)}
 else spawn("wood",W+60,ground-50)
}
function rect(o){const map={coin:[18,18],bonus:[25,25],gem:[18,24],boost:[20,28],slime:[46,38],bat:[50,28],wood:[58,48]};const [w,h]=map[o.type];return{x:o.x-w/2,y:o.y-h/2,w,h}}
function hit(a,b){return a.x<a.x+a.w&&a.x+a.w>b.x&&a.y+a.h>b.y&&a.y<b.y+b.h}
function playerRect(){return{x:player.x-player.w/2,y:player.y,w:player.w,h:player.h}}

function update(dt){
 timeLeft-=dt;if(timeLeft<=0){timeLeft=0;updateHud();end();return}
 scroll+=dt*(150+(player.boost?100:0));player.inv=Math.max(0,player.inv-dt);player.boost=Math.max(0,player.boost-dt);
 let dir=(keys.right?1:0)-(keys.left?1:0);player.vx += dir*1300*dt;player.vx*=Math.pow(.0008,dt);player.vx=Math.max(-330,Math.min(330,player.vx));
 if(keys.jump&&player.onGround){player.vy=-700;player.onGround=false;keys.jump=false}
 player.vy+=1900*dt;player.x+=player.vx*dt;player.y+=player.vy*dt;
 if(player.y+player.h>=ground){player.y=ground-player.h;player.vy=0;player.onGround=true}
 player.x=Math.max(35,Math.min(W-35,player.x));
 spawnClock-=dt;coinClock-=dt;
 if(spawnClock<=0){spawnRandom();spawnClock=Math.max(.45,1.05-Math.min(.5,(60-timeLeft)/80)+Math.random()*.65)}
 if(coinClock<=0){spawn("coin",W+50,ground-70-Math.random()*180);coinClock=.7+Math.random()*.8}
 const speed=220+(60-timeLeft)*2+(player.boost?160:0);
 for(let i=objects.length-1;i>=0;i--){const o=objects[i];o.x-=speed*dt;o.phase+=dt*5;const r=rect(o),p=playerRect();
   if(hit(p,r)){
    if(["coin","bonus","gem","boost"].includes(o.type)){score+=o.type==="coin"?10:o.type==="bonus"?50:o.type==="gem"?100:0;if(o.type==="boost")player.boost=5;for(let n=0;n<12;n++)addParticle(o.x,o.y,o.type==="gem"?"#27d8ff":"#ffd34e",4+Math.random()*5);objects.splice(i,1);updateHud();continue}
    if(player.inv<=0){lives--;player.inv=1.3;player.vy=-420;player.x-=45;for(let n=0;n<15;n++)addParticle(player.x,player.y+30,"#ff5b5b",5);updateHud();if(lives<=0){end();return}}
   }
   if(o.x<-100)objects.splice(i,1)
 }
 for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=450*dt;if(q.life<=0)particles.splice(i,1)}
}

function rounded(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function drawBackground(){
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#69d7ff");g.addColorStop(1,"#d5f6ff");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // clouds
 ctx.fillStyle="#ffffffb8";for(let i=0;i<6;i++){let x=((i*260-scroll*.08)%(W+300))-100,y=75+(i%3)*55;ctx.beginPath();ctx.arc(x,y,26,0,7);ctx.arc(x+30,y-12,34,0,7);ctx.arc(x+67,y,25,0,7);ctx.fill()}
 // hills
 ctx.fillStyle="#79c96b";ctx.beginPath();ctx.moveTo(0,ground-135);for(let x=0;x<=W;x+=90)ctx.quadraticCurveTo(x+45,ground-220-(x%180)/5,x+90,ground-135);ctx.lineTo(W,ground);ctx.lineTo(0,ground);ctx.fill();
 ctx.fillStyle="#55ad5e";ctx.beginPath();ctx.moveTo(0,ground-85);for(let x=0;x<=W;x+=120)ctx.quadraticCurveTo(x+60,ground-155,x+120,ground-85);ctx.lineTo(W,ground);ctx.lineTo(0,ground);ctx.fill();
 // ground
 ctx.fillStyle="#8a5a35";ctx.fillRect(0,ground,W,H-ground);ctx.fillStyle="#4dbb58";ctx.fillRect(0,ground,W,12);
 // path markings
 ctx.fillStyle="#b77a49";for(let x=-(scroll%80);x<W;x+=80)ctx.fillRect(x,ground+42,45,6)
 // bushes
 for(let x=-(scroll*.35%170);x<W+100;x+=170){ctx.fillStyle="#267f4d";ctx.beginPath();ctx.arc(x,ground-20,28,0,7);ctx.arc(x+28,ground-24,22,0,7);ctx.arc(x+50,ground-18,27,0,7);ctx.fill()}
}
function drawPlayer(){
 ctx.save();if(player.inv>0&&Math.floor(player.inv*12)%2===0)ctx.globalAlpha=.45;let x=player.x,y=player.y;
 // legs
 ctx.fillStyle="#25324d";rounded(x-17,y+43,12,20,5);rounded(x+5,y+43,12,20,5);ctx.fillStyle="#fff";rounded(x-20,y+58,18,8,4);rounded(x+2,y+58,18,8,4);
 // backpack
 ctx.fillStyle="#e96d35";rounded(x-27,y+12,13,30,7);
 // body
 ctx.fillStyle="#2f80ed";rounded(x-22,y+12,44,38,12);
 // face
 ctx.fillStyle="#ffd09b";ctx.beginPath();ctx.arc(x,y+5,20,0,7);ctx.fill();
 // hair
 ctx.fillStyle="#5b3825";ctx.beginPath();ctx.arc(x,y-3,20,Math.PI,Math.PI*2);ctx.fill();
 // eyes
 ctx.fillStyle="#17243b";ctx.beginPath();ctx.arc(x-7,y+5,3,0,7);ctx.arc(x+7,y+5,3,0,7);ctx.fill();
 ctx.restore();
}
function drawObject(o){
 const x=o.x,y=o.y;ctx.save();
 if(o.type==="coin"||o.type==="bonus"){ctx.fillStyle=o.type==="bonus"?"#ff9f18":"#ffd34e";ctx.beginPath();ctx.arc(x,y,o.type==="bonus"?14:10,0,7);ctx.fill();ctx.strokeStyle="#e18a00";ctx.lineWidth=3;ctx.stroke();ctx.fillStyle="#fff2a8";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText("★",x,y+4)}
 else if(o.type==="gem"){ctx.fillStyle="#28d7ff";ctx.beginPath();ctx.moveTo(x,y-15);ctx.lineTo(x+12,y);ctx.lineTo(x,y+17);ctx.lineTo(x-12,y);ctx.closePath();ctx.fill();ctx.strokeStyle="#087fa8";ctx.stroke()}
 else if(o.type==="boost"){ctx.fillStyle="#ffe047";ctx.beginPath();ctx.moveTo(x+5,y-18);ctx.lineTo(x-6,y-2);ctx.lineTo(x+2,y-2);ctx.lineTo(x-7,y+18);ctx.lineTo(x+10,y-5);ctx.lineTo(x+2,y-5);ctx.closePath();ctx.fill()}
 else if(o.type==="slime"){ctx.fillStyle="#63cf5b";ctx.beginPath();ctx.moveTo(x-23,y+18);ctx.quadraticCurveTo(x-25,y-20,x-8,y-22);ctx.quadraticCurveTo(x+2,y-33,x+12,y-19);ctx.quadraticCurveTo(x+28,y-18,x+23,y+18);ctx.closePath();ctx.fill();ctx.fillStyle="#17243b";ctx.beginPath();ctx.arc(x-8,y-5,3,0,7);ctx.arc(x+8,y-5,3,0,7);ctx.fill()}
 else if(o.type==="bat"){ctx.fillStyle="#6d4bc1";ctx.beginPath();ctx.moveTo(x-7,y);ctx.quadraticCurveTo(x-38,y-28,x-26,y+14);ctx.lineTo(x-8,y+5);ctx.quadraticCurveTo(x,y+18,x+8,y+5);ctx.lineTo(x+26,y+14);ctx.quadraticCurveTo(x+38,y-28,x+7,y);ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x-5,y,2,0,7);ctx.arc(x+5,y,2,0,7);ctx.fill()}
 else {ctx.fillStyle="#9a6036";rounded(x-29,y-24,58,48,7);ctx.fillStyle="#d79b58";ctx.fillRect(x-4,y-24,8,48);ctx.fillRect(x-29,y-4,58,6)}
 ctx.restore();
}
function draw(){
 drawBackground();objects.forEach(drawObject);drawPlayer();
 particles.forEach(q=>{ctx.globalAlpha=Math.max(0,q.life/q.max);ctx.fillStyle=q.color;ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,7);ctx.fill();ctx.globalAlpha=1});
}
function loop(now){if(!running)return;const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);draw();if(running)requestAnimationFrame(loop)}
draw();
