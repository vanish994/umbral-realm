(() => {
  const STORAGE_KEY = "umbral-realm-save-v1";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } })();
  const state = { hp: Number(saved.hp ?? 100), xp: Number(saved.xp ?? 0), level: Number(saved.level ?? 1), coins: Number(saved.coins ?? 0), talked: Boolean(saved.talked), defeated: Boolean(saved.defeated) };
  let sceneRef, player, edrin, shade, cursors, moveKeys, facing = "down", moving = false, toastTimer, attackReady = true;
  const el = id => document.getElementById(id);
  function say(message) { el("status").textContent = message; el("toast").textContent = message; el("toast").classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el("toast").classList.remove("show"), 2200); }
  function updateHud() { const maxHp = 100 + (state.level - 1) * 10; state.hp = Math.max(0, Math.min(maxHp, state.hp)); el("hp-label").textContent = state.hp + " / " + maxHp; el("hp-bar").style.width = (state.hp / maxHp * 100) + "%"; const next = state.level * 100; el("xp-label").textContent = state.xp + " / " + next + " XP"; el("xp-bar").style.width = (state.xp / next * 100) + "%"; el("level").textContent = "Nv. " + state.level; el("coins").textContent = "◈ " + state.coins; }
  function saveGame() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); say("Progresso salvo neste dispositivo."); }
  if (!window.Phaser) { el("game").innerHTML = '<p style="padding:20px;color:#e7dfd0">Não foi possível carregar o motor do jogo. Confira a conexão e recarregue a página.</p>'; return; }
  class WorldScene extends Phaser.Scene {
    constructor(){ super("world"); }
    create(){
      sceneRef = this;
      this.cameras.main.setBackgroundColor("#18201b");
      const g = this.add.graphics();
      // Procedural pixel-like forest clearing. Art assets can replace these shapes later.
      g.fillStyle(0x26382b); g.fillRect(0,0,960,640);
      for(let y=20;y<640;y+=32){ for(let x=16;x<960;x+=32){ const n=(x*13+y*7)%17; if(n<5){g.fillStyle(n%2?0x1d2c23:0x223127);g.fillRect(x,y,16,16);g.fillStyle(0x3a4932);g.fillRect(x+3,y+4,7,4);} else if(n===7){g.fillStyle(0x625742);g.fillRect(x+10,y+22,5,3);} } }
      // Winding path
      g.fillStyle(0x594b3b); g.fillRect(0,270,960,74); g.fillStyle(0x6c5a43); g.fillRect(0,282,960,4); g.fillRect(0,326,960,3);
      // Tree silhouettes around the edge
      for(let i=0;i<30;i++){const x=(i*97+31)%960,y=(i*71+43)%640;if(y>235&&y<365)continue;g.fillStyle(0x121e19);g.fillRect(x,y,24,26);g.fillStyle(i%2?0x233b2b:0x2d4430);g.fillRect(x-5,y-7,33,24);g.fillStyle(0x42543a);g.fillRect(x+3,y-3,9,5);}
      // Old stone path marker and dungeon entrance
      g.fillStyle(0x777064);g.fillRect(744,208,42,48);g.fillStyle(0x3b3b3c);g.fillRect(751,216,28,32);g.fillStyle(0x15191a);g.fillRect(756,224,18,24);
      this.add.text(735,190,"MASMORRA",{fontFamily:"monospace",fontSize:"10px",color:"#d6c49f",stroke:"#141719",strokeThickness:3});
      this.add.text(70,365,"TRILHA VELHA",{fontFamily:"monospace",fontSize:"10px",color:"#d6c49f",stroke:"#141719",strokeThickness:3});
      edrin=this.add.container(325,290); this.drawPerson(edrin,0x9b8a62,0x493b32);
      this.add.text(306,265,"EDRIN",{fontFamily:"monospace",fontSize:"10px",color:"#f0d7a0",stroke:"#161718",strokeThickness:3});
      player=this.add.container(470,305); this.drawPerson(player,0x667b91,0x303744);
      shade=this.add.container(635,305); this.drawShade(shade);
      this.physics.world.setBounds(0,0,960,640);
      this.cameras.main.setBounds(0,0,960,640); this.cameras.main.startFollow(player,true,0.12,0.12); this.cameras.main.setZoom(Math.min(1.1, this.scale.width/390));
      cursors=this.input.keyboard.createCursorKeys(); moveKeys=this.input.keyboard.addKeys("W,A,S,D,SPACE,E");
      this.input.on("pointerdown", pointer => { if(pointer.event.target.closest("button"))return; const p=this.cameras.main.getWorldPoint(pointer.x,pointer.y); const dx=p.x-player.x,dy=p.y-player.y; if(Math.hypot(dx,dy)>22){player.setData("tapTarget",{x:p.x,y:p.y});} });
      updateHud();
    }
    drawPerson(container,cloak,skin){const s=this.add.graphics();s.fillStyle(0x11140f,0.45);s.fillEllipse(0,12,25,9);s.fillStyle(cloak);s.fillRect(-8,-9,16,20);s.fillStyle(skin);s.fillRect(-6,-18,12,11);s.fillStyle(0x171a20);s.fillRect(-7,-20,14,5);s.fillStyle(0xc4a46d);s.fillRect(4,-6,3,13);container.add(s);}
    drawShade(container){const s=this.add.graphics();s.fillStyle(0x0c0d12,0.55);s.fillEllipse(0,11,27,9);s.fillStyle(0x373544);s.fillRect(-9,-8,18,19);s.fillStyle(0x24232e);s.fillTriangle(-10,-7,0,-25,10,-7);s.fillStyle(0xd7b36c);s.fillRect(-5,-8,3,3);s.fillRect(3,-8,3,3);container.add(s);}
    update(_,delta){
      if(!player)return; const speed=145;let dx=0,dy=0;
      if(cursors.left.isDown||moveKeys.A.isDown)dx=-1;else if(cursors.right.isDown||moveKeys.D.isDown)dx=1;
      if(cursors.up.isDown||moveKeys.W.isDown)dy=-1;else if(cursors.down.isDown||moveKeys.S.isDown)dy=1;
      const target=player.getData("tapTarget");if(!dx&&!dy&&target){dx=target.x-player.x;dy=target.y-player.y;if(Math.hypot(dx,dy)<8){player.setData("tapTarget",null);dx=dy=0;}else{const l=Math.hypot(dx,dy);dx/=l;dy/=l;}}
      moving=!!(dx||dy);if(moving){const len=Math.hypot(dx,dy);player.x+=dx/len*speed*delta/1000;player.y+=dy/len*speed*delta/1000;player.x=Phaser.Math.Clamp(player.x,25,935);player.y=Phaser.Math.Clamp(player.y,35,610);facing=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");}
      // Gentle idle motion for the shade; combat effects remain intentionally simple.
      if(shade&&state.hp>0&&!state.defeated&&Phaser.Math.Distance.Between(player.x,player.y,shade.x,shade.y)<170){const a=Math.atan2(player.y-shade.y,player.x-shade.x);shade.x+=Math.cos(a)*22*delta/1000;shade.y+=Math.sin(a)*22*delta/1000;if(Phaser.Math.Distance.Between(player.x,player.y,shade.x,shade.y)<24&&Math.random()<0.004){state.hp=Math.max(0,state.hp-5);updateHud();say("A sombra atinge você. Afaste-se!");if(state.hp===0){state.hp=50;player.setPosition(470,305);say("Você recobra a consciência perto da trilha.");updateHud();}}}
    }
  }
  const config={type:Phaser.AUTO,parent:"game",width:390,height:520,backgroundColor:"#18201b",pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:"arcade",arcade:{debug:false}},scene:[WorldScene]};
  new Phaser.Game(config);
  function near(a,b,range=75){return a&&b&&Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y)<=range;}
  function interact(){if(near(player,edrin,85)){state.talked=true;el("quest-text").textContent=state.defeated?"A trilha está mais quieta, mas algo observa das ruínas.":"Investigue a sombra que ronda a trilha.";say(state.defeated?"Edrin: A névoa recuou, por enquanto.":"Edrin: A névoa está viva. Há uma sombra na trilha. Se puder, detenha-a.");}else if(near(player,shade,90)&&!state.defeated){say("A criatura se contorce na névoa. Pressione ATACAR.");}else{say("Não há ninguém por perto para conversar.");}}
  function attack(){if(!attackReady||state.hp<=0)return;if(near(player,shade,65)&&!state.defeated){attackReady=false;setTimeout(()=>attackReady=true,450);shade.setAlpha(.25);setTimeout(()=>shade&&shade.setAlpha(1),130);state.defeated=true;state.xp+=50;state.coins+=8;if(state.xp>=state.level*100){state.xp-=state.level*100;state.level++;state.hp=100+(state.level-1)*10;say("Nível aumentado! Você alcançou o nível "+state.level+".");}else say("A sombra se desfaz em cinzas. +50 XP, +8 moedas.");el("quest-text").textContent="A sombra caiu. Explore a velha entrada de pedra.";el("location").textContent="Trilha Velha";updateHud();}else{say("Nenhum inimigo ao alcance. Aproxime-se da sombra.");}}
  document.querySelectorAll("[data-dir]").forEach(button=>{const dir=button.dataset.dir;const key={up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight"}[dir];const down=e=>{e.preventDefault();if(sceneRef&&cursors){const obj={up:cursors.up,down:cursors.down,left:cursors.left,right:cursors.right}[dir];obj.isDown=true;}};const up=()=>{if(cursors){const obj={up:cursors.up,down:cursors.down,left:cursors.left,right:cursors.right}[dir];obj.isDown=false;}};button.addEventListener("pointerdown",down);["pointerup","pointercancel","pointerleave"].forEach(ev=>button.addEventListener(ev,up));});
  el("interact").addEventListener("click",interact);el("attack").addEventListener("click",attack);el("save").addEventListener("click",saveGame);
  document.addEventListener("keydown",e=>{if(e.code==="Space"){e.preventDefault();attack();}if(e.key.toLowerCase()==="e")interact();});
  updateHud();
})();